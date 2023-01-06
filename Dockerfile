FROM node:lts-alpine

ENV NODE_ENV=production
ENV NODE_VERSION=18.4.0
ENV CI=true

ADD https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

ADD https://raw.githubusercontent.com/eficode/wait-for/master/wait-for /usr/local/bin/wait-for
RUN chmod +x /usr/local/bin/wait-for

WORKDIR /app

COPY ["package.json", "package-lock.json*", "/app/"]

RUN npm ci --only=production && mv node_modules /app/

#USER node

COPY --chown=node:node . /app

CMD ["wait-for", "MariaDB-TobyBot:3306", "--", "dumb-init", "node", "./src/index.js"]