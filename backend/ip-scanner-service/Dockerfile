FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    nmap \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 8018

CMD ["sh", "-c", "until pg_isready -h ${POSTGRES_SERVER:-postgres} -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-risktrix_db}; do sleep 2; done; exec uvicorn app.main:app --host 0.0.0.0 --port 8018"]
