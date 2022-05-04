import { Request, ServerRoute } from '@hapi/hapi';
import { z } from 'zod';

import { configuration } from '../utilities/configuration';
import { paths } from '../endpoints/paths';

import { telegramEndpoints } from './telegramEndpoints';
import { botUsername } from './telegramConnection';

const zodPayload = z.object({
  sessionId: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('Telegram auth started');

  const searchParams = {
    size: 'medium',
    origin: configuration.baseUri,
  };

  const url = new URL(
    `${telegramEndpoints.authorize}/${await botUsername.promise}`,
  );
  url.search = new URLSearchParams(searchParams).toString();
  logger.debug('Generated Telegram auth URL');
  return url.toString() as Output;
}

export const authUrlTelegram: ServerRoute = {
  method: 'POST',
  path: paths.telegram.authUrl,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
