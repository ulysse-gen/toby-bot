FROM node:10-alpine
LABEL authors="UlysseGen"

WORKDIR /app

RUN chown -R node:node /app

VOLUME /app

COPY . /app

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 6845

CMD [ "node", "index.js" ]