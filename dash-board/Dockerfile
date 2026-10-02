FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=secret,id=corporate-ca,target=/tmp/corporate-ca.pem,required=false \
    if [ -s /tmp/corporate-ca.pem ]; then \
      NODE_EXTRA_CA_CERTS=/tmp/corporate-ca.pem npm ci; \
    else \
      npm ci; \
    fi
COPY frontend/ ./
RUN npm run build

FROM ghcr.io/astral-sh/uv:0.12.1 AS uv-bin

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    PYTHONPATH=/app/backend
WORKDIR /app
COPY --from=uv-bin /uv /usr/local/bin/uv
RUN groupadd --system app \
    && useradd --system --gid app --home-dir /app app
COPY backend/pyproject.toml backend/uv.lock /app/backend/
RUN --mount=type=secret,id=corporate-ca,target=/tmp/corporate-ca.pem,required=false \
    if [ -s /tmp/corporate-ca.pem ]; then \
      cat /etc/ssl/certs/ca-certificates.crt /tmp/corporate-ca.pem > /tmp/ca-bundle.pem \
      && SSL_CERT_FILE=/tmp/ca-bundle.pem uv sync --project /app/backend --frozen --no-dev --no-install-project \
      && rm /tmp/ca-bundle.pem; \
    else \
      uv sync --project /app/backend --frozen --no-dev --no-install-project; \
    fi
COPY backend/app/ /app/backend/app/
COPY data/ /app/data/
COPY --from=frontend-build /frontend/dist/ /app/frontend/dist/
RUN chown -R app:app /app
USER app
EXPOSE 8080
WORKDIR /app/backend
CMD ["uv", "run", "--project", "/app/backend", "--no-sync", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers", "--forwarded-allow-ips", "*", "--no-access-log"]
