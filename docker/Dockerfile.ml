FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY services/ml-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY services/ml-service/ ./services/ml-service/
COPY ml/ ./ml/

EXPOSE 8000

ENV PYTHONPATH=/app

CMD ["uvicorn", "services.ml-service.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
