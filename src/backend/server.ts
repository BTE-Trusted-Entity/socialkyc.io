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
import { authHtmlEmail } from './email/authHtmlEmail';
import { confirmEmail } from './email/confirmEmail';
import { requestAttestationEmail } from './email/requestAttestationEmail';

import { claimTwitter } from './twitter/claimTwitter';
import { listenForTweets } from './twitter/tweets';
import { confirmTwitter } from './twitter/confirmTwitter';
import { requestAttestationTwitter } from './twitter/requestAttestationTwitter';

import { authUrlDiscord } from './discord/authUrlDiscord';
import { authHtmlDiscord } from './discord/authHtmlDiscord';
import { confirmDiscord } from './discord/confirmDiscord';
import { requestAttestationDiscord } from './discord/requestAttestationDiscord';

import { authHtmlGithub } from './github/authHtmlGithub';
import { authUrlgithub } from './github/authUrlGithub';
import { confirmGithub } from './github/confirmGithub';
import { requestAttestationGithub } from './github/requestAttestationGithub';

import { authUrlTwitch } from './twitch/authUrlTwitch';
import { authHtmlTwitch } from './twitch/authHtmlTwitch';
import { confirmTwitch } from './twitch/confirmTwitch';

import { requestAttestationTwitch } from './twitch/requestAttestationTwitch';

import { authUrlTelegram } from './telegram/authUrlTelegram';
import { confirmTelegram } from './telegram/confirmTelegram';
import { requestAttestationTelegram } from './telegram/requestAttestationTelegram';

import { authUrlYoutube } from './youtube/authUrlYoutube';
import { authHtmlYoutube } from './youtube/authHtmlYoutube';
import { confirmYoutube } from './youtube/confirmYoutube';
import { requestAttestationYoutube } from './youtube/requestAttestationYoutube';

import { requestCredential } from './verifier/requestCredential';
import { verify } from './verifier/verify';

import { session } from './endpoints/session';
import { attest } from './endpoints/attest';

import { staticFiles } from './endpoints/staticFiles';
import { quote } from './endpoints/quote';

import { liveness, testLiveness } from './endpoints/liveness';
import { maintenance } from './endpoints/maintenance';
import { notFoundHandler } from './endpoints/notFoundHandler';
import { home } from './endpoints/home';
import { about } from './endpoints/about';
import { terms } from './endpoints/terms';
import { privacy } from './endpoints/privacy';
import { sessionHeader } from './endpoints/sessionHeader';
import { metrics } from './endpoints/metrics';

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

  server.route(quote);
  server.route(attest);

  server.route(sendEmail);
  server.route(authHtmlEmail);
  server.route(confirmEmail);
  server.route(requestAttestationEmail);

  server.route(claimTwitter);
  server.route(confirmTwitter);
  server.route(requestAttestationTwitter);

  server.route(authHtmlDiscord);
  server.route(authUrlDiscord);
  server.route(confirmDiscord);
  server.route(requestAttestationDiscord);

  server.route(authHtmlGithub);
  server.route(authUrlgithub);
  server.route(confirmGithub);
  server.route(requestAttestationGithub);

  server.route(authHtmlTwitch);
  server.route(authUrlTwitch);
  server.route(confirmTwitch);
  server.route(requestAttestationTwitch);

  server.route(authUrlTelegram);
  server.route(confirmTelegram);
  server.route(requestAttestationTelegram);

  server.route(authHtmlYoutube);
  server.route(authUrlYoutube);
  server.route(confirmYoutube);
  server.route(requestAttestationYoutube);

  server.route(requestCredential);
  server.route(verify);

  server.route(home);

  server.route(liveness);
  server.route(metrics);

  server.route(staticFiles);

  server.logger.info('Routes configured');

  await manager.start();
})().catch(exitOnError);
