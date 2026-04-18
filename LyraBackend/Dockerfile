FROM node:20-alpine

# sqlite3 ships native bindings; alpine needs build tools to compile.
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

# Persist the SQLite file outside the container.
RUN mkdir -p /data
ENV DB_PATH=/data/database.sqlite

EXPOSE 3000

CMD ["node", "index.js"]
