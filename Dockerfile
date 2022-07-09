FROM node

WORKDIR /app

COPY . /app

RUN npm install

COPY . .

VOLUME /app

EXPOSE 6845