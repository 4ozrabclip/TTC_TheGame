FROM node:22-slim

RUN apt-get update && apt-get install -y build-essential python3 openssl

WORKDIR /app

COPY . .

RUN yarn

WORKDIR /app/packages/website

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]