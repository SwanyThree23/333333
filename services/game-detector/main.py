import os
import io
import logging
import requests
from typing import Optional

import cv2
import numpy as np
import pytesseract
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("game-detector")

API_URL = os.getenv('API_URL') or os.getenv('NEXT_PUBLIC_API_URL') or 'http://localhost:4000'
WEBHOOK_PATH = os.getenv('GAME_DETECTOR_WEBHOOK') or '/api/webhooks/game-detected'

GAME_DATABASE = {
    "fortnite": ["fortnite", "battle royale", "epic games"],
    "valorant": ["valorant", "riot games", "agent"],
    "minecraft": ["minecraft", "mojang"],
    "league": ["league of legends", "summoner's rift", "league"],
    "cod": ["call of duty", "warzone", "activision"],
}

# Optional template matching directory (place PNG/JPG logos here)
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), 'templates')

class GameDetector:
    def __init__(self):
        self.last_game: Optional[str] = None
        self.confidence: float = 0.0
        self.templates = self._load_templates()

    def _load_templates(self):
        templates = {}
        try:
            if not os.path.isdir(TEMPLATE_DIR):
                return templates
            for fname in os.listdir(TEMPLATE_DIR):
                fpath = os.path.join(TEMPLATE_DIR, fname)
                if not os.path.isfile(fpath):
                    continue
                key = os.path.splitext(fname)[0].lower()
                img = cv2.imread(fpath, cv2.IMREAD_GRAYSCALE)
                if img is None:
                    continue
                templates[key] = img
        except Exception as e:
            logger.warning('Failed to load templates: %s', e)
        return templates

    def detect_from_image(self, image: np.ndarray):
        try:
            # Ensure image is BGR
            if image.ndim == 2:
                bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            else:
                bgr = image

            # Resize to a reasonable size for OCR
            h, w = bgr.shape[:2]
            scale = 1280 / max(w, h) if max(w, h) > 1280 else 1.0
            if scale != 1.0:
                bgr = cv2.resize(bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

            gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
            # Basic preprocessing for OCR
            gray = cv2.medianBlur(gray, 3)
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            # OCR
            config = "--psm 6"
            text = pytesseract.image_to_string(thresh, config=config)
            text_l = (text or "").lower()

            logger.debug('OCR text: %s', text_l[:200])

            # Match against keyword DB
            for game, keywords in GAME_DATABASE.items():
                for keyword in keywords:
                    if keyword in text_l:
                        self.last_game = game
                        self.confidence = 0.95
                        return { 'game': game, 'confidence': self.confidence, 'method': 'ocr', 'match': keyword }

            # Template matching fallback
            if self.templates:
                g_gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
                for tname, tmpl in self.templates.items():
                    try:
                        res = cv2.matchTemplate(g_gray, tmpl, cv2.TM_CCOEFF_NORMED)
                        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)
                        logger.debug('Template %s match score %s', tname, max_val)
                        if max_val > 0.85:
                            # Map template name to GAME_DATABASE key if possible
                            game_key = None
                            for k in GAME_DATABASE.keys():
                                if k in tname:
                                    game_key = k
                                    break
                            game_key = game_key or tname
                            self.last_game = game_key
                            self.confidence = float(max_val)
                            return { 'game': game_key, 'confidence': self.confidence, 'method': 'template', 'template': tname }
                    except Exception as e:
                        logger.warning('Template match failed for %s: %s', tname, e)

            # No match
            return { 'game': self.last_game or 'unknown', 'confidence': 0.0, 'method': 'fallback' }
        except Exception as e:
            logger.exception('Error in detect_from_image: %s', e)
            return { 'game': self.last_game or 'unknown', 'confidence': 0.0, 'method': 'error', 'error': str(e) }

    def detect_from_window_title(self, title: str):
        try:
            title_lower = (title or '').lower()
            for game, keywords in GAME_DATABASE.items():
                if any(k in title_lower for k in keywords):
                    return { 'game': game, 'confidence': 1.0, 'method': 'window_title' }
            return None
        except Exception as e:
            logger.exception('Error detect_from_window_title: %s', e)
            return None


detector = GameDetector()
app = FastAPI(title='SwanyThree Game Detector')

@app.post('/detect')
async def detect_game(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        image_np = np.array(image)[:, :, ::-1]  # RGB->BGR for OpenCV

        result = detector.detect_from_image(image_np)

        # Notify API if confident
        try:
            confidence = float(result.get('confidence', 0))
            if confidence > 0.7:
                webhook_url = f"{API_URL.rstrip('/')}{WEBHOOK_PATH}"
                headers = {'Content-Type': 'application/json'}
                api_key = os.getenv('API_KEY')
                if api_key:
                    headers['Authorization'] = f'Bearer {api_key}'
                logger.info('Posting detection to %s', webhook_url)
                requests.post(webhook_url, json=result, headers=headers, timeout=5)
        except Exception as e:
            logger.warning('Failed to notify API: %s', e)

        return JSONResponse(result)
    except Exception as e:
        logger.exception('Error in /detect: %s', e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/health')
async def health():
    return { 'status': 'healthy' }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('PORT', '8012')))
