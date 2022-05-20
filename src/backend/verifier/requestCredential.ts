import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import { randomAsHex } from '@polkadot/util-crypto';
import { CType } from '@kiltprotocol/core';
import { IEncryptedMessage, MessageBodyType } from '@kiltprotocol/types';

import { emailCType } from '../email/emailCType';
import { twitterCType } from '../twitter/twitterCType';
import { discordCType } from '../discord/discordCType';
import { githubCType } from '../github/githubCType';
import { twitchCType } from '../twitch/twitchCType';
import { telegramCType } from '../telegram/telegramCType';
import { youtubeCType } from '../youtube/youtubeCType';
import { encryptMessageBody } from '../utilities/encryptMessage';
import { paths } from '../endpoints/paths';
import { getSessionWithDid, setSession } from '../utilities/sessionStorage';

const zodPayload = z.object({
  sessionId: z.string(),
  cType: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = IEncryptedMessage;

const cTypes: Record<string, CType['hash']> = {
  email: emailCType.hash,
  twitter: twitterCType.hash,
  discord: discordCType.hash,
  github: githubCType.hash,
  twitch: twitchCType.hash,
  telegram: telegramCType.hash,
  youtube: youtubeCType.hash,
};

function getCTypeHash(cType: string) {
  const cTypeHash = cTypes[cType];

  if (cTypeHash) {
    return cTypeHash;
  }
  throw Boom.badRequest(`Verification not offered for ${cType} CType`);
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Request credential started');

  const { sessionId, cType } = request.payload as Input;
  const session = getSessionWithDid({ sessionId });
  const { encryptionKeyId } = session;

  const cTypeHash = getCTypeHash(cType);
  logger.debug('Request credential CType found');

  const challenge = randomAsHex(24);
  setSession({ ...session, requestChallenge: challenge });
  const output = await encryptMessageBody(encryptionKeyId, {
    content: {
      cTypes: [{ cTypeHash }],
      challenge,
    },
    type: MessageBodyType.REQUEST_CREDENTIAL,
  });

  logger.debug('Request credential completed');
  return h.response(output as Output);
}

export const requestCredential: ServerRoute = {
  method: 'POST',
  path: paths.verifier.requestCredential,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
