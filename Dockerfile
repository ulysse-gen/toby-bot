FROM node:alpine
LABEL authors="UlysseGen"

WORKDIR /app
VOLUME /app
COPY . /app

COPY . .

EXPOSE 6845

CMD npm install && npm start