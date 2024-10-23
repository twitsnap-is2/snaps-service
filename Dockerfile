FROM node:lts-alpine AS builder

WORKDIR /app

COPY . .
RUN npm i 
RUN npm run build

ARG DATABASE_URL

RUN npx prisma db push

FROM node:lts-alpine

WORKDIR /app

COPY --from=builder /app/dist /app/dist

COPY --from=builder /app/node_modules /app/node_modules

COPY --from=builder /app/package.json /app/package.json

# EXPOSE 4003
CMD ["npm", "run", "start"]