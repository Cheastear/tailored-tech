FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

RUN npm ci

COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api

RUN npx prisma generate && npx nest build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
