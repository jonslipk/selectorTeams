FROM node:14-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g @angular/cli@11.2.19 \
 && npm install

COPY . .

EXPOSE 4200

CMD ["npm", "start"]
