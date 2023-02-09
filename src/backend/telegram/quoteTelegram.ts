import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { encryptMessageBody } from '../utilities/encryptMessage';
import { getSession } from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { telegramCType } from './telegramCType';

export type Input = Record<string, never>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Telegram quote started');

  const { encryptionKeyUri, claim, confirmed } = getSession(request.headers);

  if (!claim || !confirmed) {
    throw Boom.notFound('Confirmed claim not found');
  }

  const output = await encryptMessageBody(encryptionKeyUri, {
    content: {
      claim,
      legitimations: [],
      cTypes: [telegramCType],
    },
    type: 'submit-terms',
  });

  logger.debug('Telegram quote completed');
  return h.response(output as Output);
}

export const quoteTelegram: ServerRoute = {
  method: 'POST',
  path: paths.telegram.quote,
  handler,
};
