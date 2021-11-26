import Hapi from '@hapi/hapi';
import inert from '@hapi/inert';
import pino from 'hapi-pino';
import exiting from 'exiting';

import { configuration } from './utilities/configuration';
import { configureAuthentication } from './utilities/configureAuthentication';
import { configureDevErrors } from './utilities/configureDevErrors';
import { fullDidPromise } from './utilities/fullDid';

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

import { quoteDotsama } from './dotsama/quoteDotsama';
import { requestAttestationDotsama } from './dotsama/requestAttestationDotsama';
import { attestationDotsama } from './dotsama/attestationDotsama';

import { requestCredential } from './verifier/requestCredential';
import { verify } from './verifier/verify';

import { session } from './endpoints/session';

import { staticFiles } from './endpoints/staticFiles';

import { liveness } from './endpoints/liveness';
import { notFoundHandler } from './endpoints/notFoundHandler';

const { isProduction, port } = configuration;

const server = Hapi.server({
  port,
  host: 'localhost',
  address: '127.0.0.1',
  debug: isProduction ? false : undefined,
  routes: { security: true },
});
const manager = exiting.createManager(server);

const logger = {
  plugin: pino,
  options: {
    prettyPrint: !isProduction,
    ignoreTags: ['noLogs'],
    level: isProduction ? 'info' : 'debug',
    logRequestComplete: isProduction,
    redact: isProduction ? [] : { paths: ['req', 'res'], remove: true },
  },
};

(async () => {
  await server.register(inert);
  await server.register(logger);
  await configureAuthentication(server);
  await configureDevErrors(server);
  server.logger.info('Server configured');

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

  server.route(quoteDotsama);
  server.route(requestAttestationDotsama);
  server.route(attestationDotsama);

  server.route(requestCredential);
  server.route(verify);

  server.route(staticFiles);

  server.route(liveness);

  server.ext('onPreResponse', notFoundHandler);
  server.logger.info('Routes configured');

  await manager.start();
})();
