FROM alpine:3.16

ENV NODE_VERSION 18.5.0

VOLUME /app

WORKDIR /app

COPY . /app

RUN npm install

COPY . /app

EXPOSE 6845

CMD ["node", "index.js"]