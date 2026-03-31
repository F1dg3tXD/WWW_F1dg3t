FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run Flask via gunicorn (production ready)
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "run_web:app"]
