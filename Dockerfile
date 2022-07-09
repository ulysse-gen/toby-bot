FROM node:alpine
LABEL authors="UlysseGen"

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN npm install -g npm-check-updates \
    ncu -u \
    npm install

COPY . /app
EXPOSE 6845
CMD npm start