FROM node
LABEL authors="UlysseGen"
# update dependencies and install curl
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*
# Create app directory
WORKDIR /app
VOLUME /app
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
# COPY package*.json ./ \
#     ./source ./

# This will copy everything from the source path 
# --more of a convenience when testing locally.
COPY . .
# update each dependency in package.json to the latest version
RUN npm install -g npm-check-updates \
    npm install
# Bundle app source
COPY . /app
EXPOSE 6845
CMD [ "index.js" ]