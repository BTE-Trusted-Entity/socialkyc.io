FROM node:16-alpine
WORKDIR /app
COPY . ./
RUN yarn install --frozen-lockfile
RUN yarn build
EXPOSE 3000
ENTRYPOINT ["yarn", "start"]
