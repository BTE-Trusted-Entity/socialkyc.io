import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import { IEncryptedMessage } from '@kiltprotocol/types';
import { z } from 'zod';

import { encryptMessageBody } from '../utilities/encryptMessage';
import { getSession } from '../utilities/sessionStorage';
import { supportedCTypes, SupportedCType } from '../utilities/supportedCTypes';
import { supportedCTypeKeys } from '../utilities/supportedCType';

import { paths } from './paths';

export type Input = Record<string, never>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request<{ Params: { type: SupportedCType } }>,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const {
    logger,
    params: { type },
  } = request;

  logger.debug(`Quote started for ${type}`);

  const { encryptionKeyUri, claim, confirmed } = getSession(request.headers);

  if (!claim || !confirmed) {
    throw Boom.notFound('Confirmed claim not found');
  }

  const cType = supportedCTypes[type];
  const output = await encryptMessageBody(encryptionKeyUri, {
    content: {
      claim,
      legitimations: [],
      cTypes: [cType],
    },
    type: 'submit-terms',
  });

  logger.debug(`Quote completed for ${type}`);
  return h.response(output as Output);
}

const zodParams = z.object({ type: z.enum(supportedCTypeKeys) });

export const quote = {
  method: 'POST',
  path: paths.quote,
  handler,
  options: { validate: { params: async (params) => zodParams.parse(params) } },
} as ServerRoute;
