# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nuxt
COPY --from=builder --chown=nuxt:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxt:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nuxt:nodejs /app/node_modules/@prisma ./node_modules/@prisma
USER nuxt
EXPOSE 3000
CMD ["sh", "-c", "export NUXT_PUBLIC_DATA_SERVICE_KEY=\"$PUBLIC_DATA_SERVICE_KEY\" NUXT_KAKAO_REST_API_KEY=\"$KAKAO_REST_API_KEY\" NUXT_PUBLIC_KAKAO_RUN_JAVASCRIPT_KEY=\"$KAKAO_RUN_JAVASCRIPT_KEY\" NUXT_PUBLIC_KAKAO_BABY_JAVASCRIPT_KEY=\"$KAKAO_BABY_JAVASCRIPT_KEY\" NUXT_DATABASE_URL=\"$DATABASE_URL\" NUXT_PUBLIC_APP_BASE_URL=\"$APP_BASE_URL\"; exec node .output/server/index.mjs"]
