FROM node:lts-alpine

ENV NODE_ENV=production
ENV NODE_VERSION=18.4.0
ENV CI=true

RUN npm install -g http-server


WORKDIR /app

COPY ["package.json", "package-lock.json*", "/app/"]

RUN npm ci && mv node_modules /app/

COPY . /app

RUN npm run build

CMD ["npm run start"]