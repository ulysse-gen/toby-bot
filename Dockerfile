FROM node:10-alpine

RUN chown -R node:node /home/node/app

WORKDIR /home/node/app

RUN ls

COPY . /app

RUN npm install

COPY --chown=node:node . .

VOLUME /home/node/app

EXPOSE 6845

CMD [ "node", "index.js" ]