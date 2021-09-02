FROM node:lts-alpine
WORKDIR /app
COPY . ./
RUN yarn install --frozen-lockfile
RUN yarn build
EXPOSE 3000
ENTRYPOINT ["yarn", "start"]
