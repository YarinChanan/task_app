FROM node:latest

WORKDIR /usr/src/task_app

COPY . .

RUN npm install

EXPOSE 3000

CMD ["node", "server.js"]