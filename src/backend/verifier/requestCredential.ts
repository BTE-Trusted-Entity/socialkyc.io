import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import { randomAsHex } from '@polkadot/util-crypto';
import { ICType, IEncryptedMessage } from '@kiltprotocol/types';

import { emailCType } from '../email/emailCType';
import { twitterCType } from '../twitter/twitterCType';
import { discordCType } from '../discord/discordCType';
import { githubCType } from '../github/githubCType';
import { twitchCType } from '../twitch/twitchCType';
import { telegramCType } from '../telegram/telegramCType';
import { youtubeCType } from '../youtube/youtubeCType';
import { encryptMessageBody } from '../utilities/encryptMessage';
import { paths } from '../endpoints/paths';
import { getSession, setSession } from '../utilities/sessionStorage';

const zodPayload = z.object({
  cType: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = IEncryptedMessage;

const cTypes: Record<string, ICType['hash']> = {
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

  const { cType } = request.payload as Input;
  const session = getSession(request.headers);
  const { encryptionKeyUri } = session;

  const cTypeHash = getCTypeHash(cType);
  logger.debug('Request credential CType found');

  const challenge = randomAsHex(24);
  setSession({ ...session, requestChallenge: challenge });
  const output = await encryptMessageBody(encryptionKeyUri, {
    content: {
      cTypes: [{ cTypeHash }],
      challenge,
    },
    type: 'request-credential',
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
