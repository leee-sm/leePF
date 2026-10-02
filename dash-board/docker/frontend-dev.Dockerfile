FROM node:22-alpine

WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=secret,id=corporate-ca,target=/tmp/corporate-ca.pem,required=false \
    if [ -s /tmp/corporate-ca.pem ]; then \
      NODE_EXTRA_CA_CERTS=/tmp/corporate-ca.pem npm ci; \
    else \
      npm ci; \
    fi

EXPOSE 5173
CMD ["npm", "run", "dev"]
