import inert from '@hapi/inert';
import pino from 'hapi-pino';
import gate from 'hapi-gate';

import { fullDidPromise } from './utilities/fullDid';
import { testTwitterCType } from './twitter/twitterCType';
import { testEmailCType } from './email/emailCType';
import { testDomainLinkageCType } from './didConfiguration/domainLinkageCType';
import { testDiscordCType } from './discord/discordCType';
import { testGithubCType } from './github/githubCType';
import { testTwitchCType } from './twitch/twitchCType';
import { testTelegramCType } from './telegram/telegramCType';
import { testYoutubeCType } from './youtube/youtubeCType';
import { testInstagramCType } from './instagram/instagramCType';
import { configuration } from './utilities/configuration';
import { configureAuthentication } from './utilities/configureAuthentication';
import { configureDevErrors } from './utilities/configureDevErrors';
import { manager, server } from './utilities/manager';
import { exitOnError } from './utilities/exitOnError';

import { wellKnownDidConfig } from './didConfiguration/wellKnownDidConfig';

import { authHtmlEmail } from './email/authHtmlEmail';
import { quoteEmail } from './email/quoteEmail';
import { confirmEmail } from './email/confirmEmail';
import { requestAttestationEmail } from './email/requestAttestationEmail';
import { attestationEmail } from './email/attestationEmail';

import { listenForTweets } from './twitter/tweets';
import { quoteTwitter } from './twitter/quoteTwitter';
import { confirmTwitter } from './twitter/confirmTwitter';
import { requestTwitter } from './twitter/requestAttestationTwitter';
import { attestationTwitter } from './twitter/attestationTwitter';

import { authUrlDiscord } from './discord/authUrlDiscord';
import { authHtmlDiscord } from './discord/authHtmlDiscord';
import { confirmDiscord } from './discord/confirmDiscord';
import { quoteDiscord } from './discord/quoteDiscord';
import { requestAttestationDiscord } from './discord/requestAttestationDiscord';
import { attestDiscord } from './discord/attestDiscord';

import { authHtmlGithub } from './github/authHtmlGithub';
import { authUrlgithub } from './github/authUrlGithub';
import { confirmGithub } from './github/confirmGithub';
import { quoteGithub } from './github/quoteGithub';
import { requestAttestationGithub } from './github/requestAttestationGithub';
import { attestGithub } from './github/attestGithub';

import { authUrlTwitch } from './twitch/authUrlTwitch';
import { authHtmlTwitch } from './twitch/authHtmlTwitch';
import { confirmTwitch } from './twitch/confirmTwitch';

import { authHtmlInstagram } from './instagram/authHtmlInstagram';
import { authUrlInstagram } from './instagram/authUrlInstagram';
import { confirmInstagram } from './instagram/confirmInstagram';
import { quoteInstagram } from './instagram/quoteInstagram';
import { requestAttestationInstagram } from './instagram/requestAttestationInstagram';
import { attestInstagram } from './instagram/attestInstagram';

import { quoteTwitch } from './twitch/quoteTwitch';
import { requestAttestationTwitch } from './twitch/requestAttestationTwitch';
import { attestTwitch } from './twitch/attestTwitch';

import { authUrlTelegram } from './telegram/authUrlTelegram';
import { confirmTelegram } from './telegram/confirmTelegram';
import { quoteTelegram } from './telegram/quoteTelegram';
import { requestAttestationTelegram } from './telegram/requestAttestationTelegram';
import { attestTelegram } from './telegram/attestTelegram';

import { authUrlYoutube } from './youtube/authUrlYoutube';
import { authHtmlYoutube } from './youtube/authHtmlYoutube';
import { confirmYoutube } from './youtube/confirmYoutube';
import { quoteYoutube } from './youtube/quoteYoutube';
import { requestAttestationYoutube } from './youtube/requestAttestationYoutube';
import { attestYoutube } from './youtube/attestYoutube';

import { requestCredential } from './verifier/requestCredential';
import { verify } from './verifier/verify';

import { session } from './endpoints/session';

import { staticFiles } from './endpoints/staticFiles';

import { liveness, testLiveness } from './endpoints/liveness';
import { notFoundHandler } from './endpoints/notFoundHandler';
import { home } from './endpoints/home';
import { about } from './endpoints/about';
import { terms } from './endpoints/terms';
import { privacy } from './endpoints/privacy';
import { sessionHeader } from './endpoints/sessionHeader';

const { isProduction } = configuration;

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
  await testInstagramCType();

  server.logger.info('CTypes tested');

  await listenForTweets();
  server.logger.info('Twitter connection initialized');

  server.route(wellKnownDidConfig);

  server.route(session);

  server.route(authHtmlEmail);
  server.route(quoteEmail);
  server.route(confirmEmail);
  server.route(requestAttestationEmail);
  server.route(attestationEmail);

  server.route(quoteTwitter);
  server.route(confirmTwitter);
  server.route(requestTwitter);
  server.route(attestationTwitter);

  server.route(authHtmlDiscord);
  server.route(authUrlDiscord);
  server.route(confirmDiscord);
  server.route(quoteDiscord);
  server.route(requestAttestationDiscord);
  server.route(attestDiscord);

  server.route(authHtmlGithub);
  server.route(authUrlgithub);
  server.route(confirmGithub);
  server.route(quoteGithub);
  server.route(requestAttestationGithub);
  server.route(attestGithub);

  server.route(authHtmlTwitch);
  server.route(authUrlTwitch);
  server.route(confirmTwitch);
  server.route(quoteTwitch);
  server.route(requestAttestationTwitch);
  server.route(attestTwitch);

  server.route(authHtmlInstagram);
  server.route(authUrlInstagram);
  server.route(confirmInstagram);
  server.route(quoteInstagram);
  server.route(requestAttestationInstagram);
  server.route(attestInstagram);

  server.route(authUrlTelegram);
  server.route(confirmTelegram);
  server.route(quoteTelegram);
  server.route(requestAttestationTelegram);
  server.route(attestTelegram);

  server.route(authHtmlYoutube);
  server.route(authUrlYoutube);
  server.route(confirmYoutube);
  server.route(quoteYoutube);
  server.route(requestAttestationYoutube);
  server.route(attestYoutube);

  server.route(requestCredential);
  server.route(verify);

  server.route(home);
  server.route(about);
  server.route(terms);
  server.route(privacy);

  server.route(staticFiles);

  server.route(liveness);

  server.ext('onPreResponse', notFoundHandler);
  server.logger.info('Routes configured');

  await manager.start();
})().catch(exitOnError);
