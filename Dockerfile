FROM node:10-alpine
LABEL authors="UlysseGen"

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY . /app

RUN npm install

COPY --chown=node:node . .

VOLUME /home/node/app

EXPOSE 6845

CMD [ "node", "index.js" ]