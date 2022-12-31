FROM node:lts-alpine

ENV NODE_ENV=production
ENV NODE_VERSION=18.4.0
ENV CI=true

ADD https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

WORKDIR /app

COPY ["tsconfig.json", "package.json", "package-lock.json*", "src/wait-for", "/app/"]
RUN chmod +x /app/wait-for

RUN npm ci --only=production && mv node_modules /app/

#USER node

COPY --chown=node:node . /app

RUN npm run build

CMD ["./wait-for", "MariaDB-TobyBot:3306", "--", "dumb-init", "npm", "start"]