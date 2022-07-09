FROM node:alpine
ENV NODE_ENV=production

LABEL authors="UlysseGen"

WORKDIR /app

VOLUME /app

COPY . .

RUN npm install --production

COPY . /app

EXPOSE 6845

CMD [ "node", "index.js" ]