
FROM node:carbon
LABEL maintainer="chriamue@gmail.com"
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . ./
CMD "npm" "start"
EXPOSE 8000