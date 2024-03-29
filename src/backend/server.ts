import inert from '@hapi/inert';
import pino from 'hapi-pino';
import gate from 'hapi-gate';

import { getSecret } from './endpoints/getSecret';

import { fullDidPromise } from './utilities/fullDid';
import { testTwitterCType } from './twitter/twitterCType';
import { testEmailCType } from './email/emailCType';
import { testDomainLinkageCType } from './didConfiguration/domainLinkageCType';
import { testDiscordCType } from './discord/discordCType';
import { testGithubCType } from './github/githubCType';
import { testTwitchCType } from './twitch/twitchCType';
import { testTelegramCType } from './telegram/telegramCType';
import { testYoutubeCType } from './youtube/youtubeCType';
import { configuration } from './utilities/configuration';
import { configureAuthentication } from './utilities/configureAuthentication';
import { configureDevErrors } from './utilities/configureDevErrors';
import { manager, server } from './utilities/manager';
import { exitOnError } from './utilities/exitOnError';

import { wellKnownDidConfig } from './didConfiguration/wellKnownDidConfig';

import { sendEmail } from './email/sendEmail';
import { confirmEmail } from './email/confirmEmail';

import { claimTwitter } from './twitter/claimTwitter';
import { listenForTweets } from './twitter/tweets';
import { confirmTwitter } from './twitter/confirmTwitter';

import { confirmTelegram } from './telegram/confirmTelegram';

import { requestCredential } from './verifier/requestCredential';
import { verify } from './verifier/verify';
import { rejectAttestation } from './verifier/rejectAttestation';

import { session } from './endpoints/session';
import { authHtml } from './endpoints/authHtml';
import { authUrl } from './endpoints/authUrl';
import { confirm } from './endpoints/confirm';
import { quote } from './endpoints/quote';
import { requestAttestation } from './endpoints/requestAttestation';
import { attest } from './endpoints/attest';

import { staticFiles } from './endpoints/staticFiles';

import { liveness, testLiveness } from './endpoints/liveness';
import { maintenance } from './endpoints/maintenance';
import { notFoundHandler } from './endpoints/notFoundHandler';
import { home } from './endpoints/home';
import { about } from './endpoints/about';
import { terms } from './endpoints/terms';
import { privacy } from './endpoints/privacy';
import { sessionHeader } from './endpoints/sessionHeader';
import { metrics } from './endpoints/metrics';
import { initExpiredInventory } from './revoker/expiredInventory';

const { isProduction, maintenanceMode, baseUri } = configuration;

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
    level: isProduction ? 'debug' : 'trace',
    logRequestComplete: isProduction,
    redact: isProduction
      ? [
          'req.headers.authorization',
          'req.headers["x-forwarded-for"]',
          'req.headers["x-real-ip"]',
          `req.headers["${sessionHeader}"]`,
        ]
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

  server.route(about);
  server.route(terms);
  server.route(privacy);

  server.ext('onPreResponse', notFoundHandler);

  if (maintenanceMode) {
    server.logger.info('Maintenance mode');
    server.route(maintenance);
    server.route(staticFiles);
    await manager.start();
    return;
  }

  await testLiveness();
  server.logger.info('Liveness tests passed');

  await fullDidPromise;
  server.logger.info('Blockchain connection initialized');

  await testDomainLinkageCType();
  await testEmailCType();
  await testTwitterCType();
  await testDiscordCType();
  await testGithubCType();
  await testTwitchCType();
  await testTelegramCType();
  await testYoutubeCType();

  server.logger.info('CTypes tested');

  await listenForTweets();
  server.logger.info('Twitter connection initialized');

  server.route(wellKnownDidConfig);

  server.route(session);

  if (baseUri === 'http://localhost:3000' || 'https://dev.socialkyc.io') {
    server.route(getSecret);
  }

  server.route(authHtml);
  server.route(authUrl);
  server.route(confirm);
  server.route(quote);
  server.route(requestAttestation);
  server.route(attest);

  server.route(sendEmail);
  server.route(confirmEmail);

  server.route(claimTwitter);
  server.route(confirmTwitter);

  server.route(confirmTelegram);

  server.route(requestCredential);
  server.route(verify);
  server.route(rejectAttestation);

  server.route(home);

  server.route(liveness);
  server.route(metrics);

  server.route(staticFiles);

  server.logger.info('Routes configured');

  await manager.start();

  initExpiredInventory();
})().catch(exitOnError);
