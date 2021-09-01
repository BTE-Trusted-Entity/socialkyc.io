FROM node:lts-alpine
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
EXPOSE 3000
ENTRYPOINT ["yarn", "start"]
