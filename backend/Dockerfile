FROM python:3.10-slim

WORKDIR /app

# System deps (minimal)
RUN pip install --no-cache-dir --upgrade pip

# Install Python deps first for caching
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend source
COPY backend /app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]