import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { IEncryptedMessage, MessageBodyType } from '@kiltprotocol/types';

import { encryptMessageBody } from '../utilities/encryptMessage';
import { getSession } from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { instagramCType } from './instagramCType';

export type Input = Record<string, never>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Instagram quote started');

  const { encryptionKeyId, claim, confirmed } = getSession(request.headers);
  if (!claim || !confirmed) {
    throw Boom.notFound('Confirmed claim not found');
  }

  const output = await encryptMessageBody(encryptionKeyId, {
    content: {
      claim,
      legitimations: [],
      cTypes: [instagramCType],
    },
    type: MessageBodyType.SUBMIT_TERMS,
  });

  logger.debug('Instagram quote completed');
  return h.response(output as Output);
}

export const quoteInstagram: ServerRoute = {
  method: 'POST',
  path: paths.instagram.quote,
  handler,
};
