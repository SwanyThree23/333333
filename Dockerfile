# Base stage
FROM node:22-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build stage
FROM base AS build
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:22-bookworm-slim AS production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/server ./server
COPY --from=build /app/package.json ./package.json

EXPOSE 3001
CMD ["npm", "run", "server"]
