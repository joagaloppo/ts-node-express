FROM node:alpine

WORKDIR /usr/src/app

COPY package*.json ./

COPY .env ./

COPY ./prisma prisma

RUN npm ci --only=production

RUN npx prisma generate

COPY dist ./dist

EXPOSE 3000

CMD ["npm", "start"]
