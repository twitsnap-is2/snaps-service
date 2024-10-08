FROM node:lts-alpine AS builder

WORKDIR /app

COPY . .
RUN npm i && npm run build

RUN npx prisma generate

FROM node:lts-alpine

WORKDIR /app

COPY --from=builder /app/dist /app/dist

COPY --from=builder /app/node_modules /app/node_modules

COPY --from=builder /app/package.json /app/package.json

# COPY --from=builder /app/prisma /app/prisma

# EXPOSE 4003
CMD ["npm", "run", "start"]