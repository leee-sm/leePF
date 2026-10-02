FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /workspace
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/playwright.config.ts ./
COPY frontend/tests/e2e ./tests/e2e

CMD ["npm", "run", "test:e2e"]
