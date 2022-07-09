FROM node:10-alpine
LABEL authors="UlysseGen"

RUN mkdir -p /app/node_modules && chown -R node:node /app

WORKDIR /app

VOLUME /app

COPY . /app

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 6845

CMD [ "node", "index.js" ]