FROM node:apline

VOLUME /app

WORKDIR /app

COPY . /app

RUN npm install

COPY . /app

EXPOSE 6845

CMD ["node", "index.js"]