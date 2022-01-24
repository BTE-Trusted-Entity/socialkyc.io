import Hapi from '@hapi/hapi';
import inert from '@hapi/inert';
import pino from 'hapi-pino';
import gate from 'hapi-gate';
import exiting from 'exiting';

import { fullDidPromise } from './utilities/fullDid';
import { storeTwitterCType } from './twitter/twitterCType';
import { storeEmailCType } from './email/emailCType';
import { storeDomainLinkageCType } from './didConfiguration/domainLinkageCType';

import { configuration } from './utilities/configuration';
import { configureAuthentication } from './utilities/configureAuthentication';
import { configureDevErrors } from './utilities/configureDevErrors';

import { confirmationHtml } from './endpoints/confirmationHtml';
import { wellKnownDidConfig } from './didConfiguration/wellKnownDidConfig';

import { quoteEmail } from './email/quoteEmail';
import { confirmEmail } from './email/confirmEmail';
import { request } from './email/sendEmail';
import { attestationEmail } from './email/attestationEmail';

import { listenForTweets } from './twitter/tweets';
import { quoteTwitter } from './twitter/quoteTwitter';
import { confirmTwitter } from './twitter/confirmTwitter';
import { requestTwitter } from './twitter/requestAttestationTwitter';
import { attestationTwitter } from './twitter/attestationTwitter';

import { requestCredential } from './verifier/requestCredential';
import { verify } from './verifier/verify';

import { session } from './endpoints/session';

import { staticFiles } from './endpoints/staticFiles';

import { liveness } from './endpoints/liveness';
import { notFoundHandler } from './endpoints/notFoundHandler';
import { index } from './endpoints';
import { about } from './endpoints/about';
import { terms } from './endpoints/terms';
import { privacy } from './endpoints/privacy';

const { isProduction, port } = configuration;

const server = Hapi.server({
  port,
  host: '127.0.0.1',
  uri: configuration.baseUri,
  debug: isProduction ? false : undefined,
  routes: { security: true },
});
const manager = exiting.createManager(server);

const noWww = {
  plugin: gate,
  options: {
    https: false,
    nonwww: true,
  },
};

const logger = {
  plugin: pino,
  options: {
    ...(!isProduction && { transport: { target: 'pino-pretty' } }),
    ignoreTags: ['noLogs'],
    level: isProduction ? 'info' : 'debug',
    logRequestComplete: isProduction,
    redact: isProduction
      ? ['req.headers.authorization']
      : { paths: ['req', 'res'], remove: true },
  },
};

(async () => {
  await server.register(noWww);
  await server.register(inert);
  await server.register(logger);
  await configureAuthentication(server);
  await configureDevErrors(server);
  server.logger.info('Server configured');

  if (configuration.storeDidAndCTypes) {
    await fullDidPromise;
    await storeDomainLinkageCType();
    await storeEmailCType();
    await storeTwitterCType();
    server.logger.warn('Blockchain objects stored');
  }

  await fullDidPromise;
  server.logger.info('Blockchain connection initialized');

  await listenForTweets();
  server.logger.info('Twitter connection initialized');

  server.route(confirmationHtml);
  server.route(wellKnownDidConfig);

  server.route(session);

  server.route(quoteEmail);
  server.route(confirmEmail);
  server.route(request);
  server.route(attestationEmail);

  server.route(quoteTwitter);
  server.route(confirmTwitter);
  server.route(requestTwitter);
  server.route(attestationTwitter);

  server.route(requestCredential);
  server.route(verify);

  server.route(index);
  server.route(about);
  server.route(terms);
  server.route(privacy);

  server.route(staticFiles);

  server.route(liveness);

  server.ext('onPreResponse', notFoundHandler);
  server.logger.info('Routes configured');

  await manager.start();
})();
