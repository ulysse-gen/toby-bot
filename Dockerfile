FROM alpine:3.16

RUN mkdir -p /app \
    && apk add --no-cache git

ENV NODE_VERSION 18.5.0

VOLUME /app

WORKDIR /app

COPY . /app

RUN npm install --unsafe-perm

COPY . /app

EXPOSE 6845

ENTRYPOINT ["npm"]
CMD ["start"]