FROM python:3.11-slim

# Install system deps and tesseract for OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    tesseract-ocr \
    libtesseract-dev \
    pkg-config \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

EXPOSE 8012
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8012"]
