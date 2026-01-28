import asyncio
import json
from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

class UnityBridge:
    def __init__(self):
        self.connections = set()

    async def register(self, websocket: WebSocket):
        self.connections.add(websocket)
        try:
            await websocket.receive_text()  # keep the connection alive
        except Exception:
            pass
        finally:
            self.connections.discard(websocket)

    async def send_command(self, command: dict):
        if not self.connections:
            return False
        message = json.dumps(command)
        await asyncio.gather(*[conn.send_text(message) for conn in list(self.connections)], return_exceptions=True)
        return True

bridge = UnityBridge()

@app.websocket('/unity')
async def unity_endpoint(websocket: WebSocket):
    await websocket.accept()
    bridge.connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        bridge.connections.discard(websocket)

@app.post('/trigger-animation')
async def trigger_animation(payload: dict):
    emotion = payload.get('emotion')
    intensity = float(payload.get('intensity', 1.0))
    sent = await bridge.send_command({
        'type': 'animation',
        'emotion': emotion,
        'intensity': intensity
    })
    return JSONResponse({'status': 'sent' if sent else 'no_connections'})

@app.post('/speak')
async def speak(payload: dict):
    text = payload.get('text')
    audio_url = payload.get('audio_url')
    sent = await bridge.send_command({
        'type': 'speak',
        'text': text,
        'audioUrl': audio_url
    })
    return JSONResponse({'status': 'sent' if sent else 'no_connections'})

@app.get('/health')
async def health():
    return {'status': 'healthy', 'connections': len(bridge.connections)}

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8012)
