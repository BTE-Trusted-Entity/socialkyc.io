FROM node:16-alpine AS base

WORKDIR /app

FROM base AS builder

# one of dependencies uses node-gyp which requires build tools
RUN apk add --update --no-cache python3 g++ make && ln -sf python3 /usr/bin/python

# get the sources
COPY . ./

# install build dependencies, build the app
RUN yarn install --frozen-lockfile --ignore-optional && yarn cache clean --all && yarn build

FROM base AS release

# tell the app it will run in production mode
ENV NODE_ENV production

# carry over the dependencies data
COPY package.json yarn.lock ./
# install the production dependencies only (depends on NODE_ENV)
RUN yarn install --frozen-lockfile --ignore-optional && yarn cache clean --all

# carry over the built code
COPY --from=builder /app/dist dist

EXPOSE 3000
ENTRYPOINT ["yarn", "--silent", "start"]
