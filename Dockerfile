FROM node:alpine
ENV NODE_ENV=production

LABEL authors="UlysseGen"

WORKDIR /app

VOLUME /app

COPY . /app

RUN npm install

COPY . .

EXPOSE 6845

CMD [ "node", "index.js" ]