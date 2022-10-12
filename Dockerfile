FROM node:lts-alpine

ENV NODE_ENV=production
ENV NODE_VERSION=18.4.0
ENV CI=true

WORKDIR /app

COPY ["package.json", "package-lock.json*", "/app/"]

RUN npm install --production --silent && mv node_modules /app/

COPY . /app

CMD ["npm", "start"]