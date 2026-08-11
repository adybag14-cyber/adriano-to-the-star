FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY token_server.py .

# Use gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "token_server:app"]
