FROM node:latest

RUN mkdir -p /app

WORKDIR /app

COPY . /app

RUN npm install

COPY . /app

VOLUME /app

EXPOSE 6845

CMD ["node", "index.js"]