FROM node:current-alpine as build
WORKDIR /app
COPY package.json /app/
RUN npm install
COPY . /app/
RUN npm run build

FROM node:current-alpine
WORKDIR /app
COPY --from=build /app/dist /app
COPY --from=build /root/.npm /root/.npm
RUN npm install -g pm2 modclean \
    && npm install --only=prod \
    && modclean -r \
    && modclean -r /usr/local/lib/node_modules/pm2 \
    && npm uninstall -g modclean \
    && npm cache clear --force \
    && rm -rf /root/.npm /usr/local/lib/node_modules/npm
RUN apk add nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY start.sh /root/start.sh
RUN chmod u+x /root/start.sh
ENV PORT 80
EXPOSE 80
CMD ["/root/start.sh"]
