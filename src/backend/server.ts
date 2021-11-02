import Hapi from '@hapi/hapi';
import inert from '@hapi/inert';
import pino from 'hapi-pino';
import exiting from 'exiting';

import { configuration } from './utilities/configuration';
import { request } from './endpoints/sendEmail';
import { requestTwitter } from './endpoints/requestAttestationTwitter';
import { confirmationHtml } from './endpoints/confirmationHtml';
import { attestationEmail } from './endpoints/attestationEmail';
import { attestationTwitter } from './endpoints/attestationTwitter';
import { staticFiles } from './endpoints/staticFiles';
import { liveness } from './endpoints/liveness';
import { quoteEmail } from './endpoints/quoteEmail';
import { quoteTwitter } from './endpoints/quoteTwitter';
import { challenge } from './endpoints/challenge';
import { verify } from './endpoints/verify';
import { requestCredential } from './endpoints/requestCredential';
import { wellKnownDidConfig } from './endpoints/wellKnownDidConfig';
import { configureAuthentication } from './utilities/configureAuthentication';
import { configureDevErrors } from './utilities/configureDevErrors';
import { fullDidPromise } from './utilities/fullDid';
import { listenForTweets } from './utilities/tweets';
import { notFoundHandler } from './utilities/notFoundHandler';

const { isProduction, port } = configuration;

const server = Hapi.server({
  port,
  host: '0.0.0.0',
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

  server.route(liveness);
  server.route(staticFiles);
  server.route(challenge);
  server.route(quoteEmail);
  server.route(quoteTwitter);
  server.route(request);
  server.route(requestTwitter);
  server.route(confirmationHtml);
  server.route(attestationEmail);
  server.route(attestationTwitter);
  server.route(requestCredential);
  server.route(verify);
  server.route(wellKnownDidConfig);

  server.ext('onPreResponse', notFoundHandler);
  server.logger.info('Routes configured');

  await manager.start();
})();
