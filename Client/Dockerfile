FROM nginx:latest

COPY task_nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

COPY . .

EXPOSE 80