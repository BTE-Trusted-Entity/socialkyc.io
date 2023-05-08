import type {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import type { IEncryptedMessage } from '@kiltprotocol/sdk-js';
import type { HexString } from '@polkadot/util/types';

import { z } from 'zod';

import { encryptMessageBody } from '../utilities/encryptMessage';
import { paths } from '../endpoints/paths';
import { getSession } from '../utilities/sessionStorage';

const zodPayload = z.object({
  rootHash: z
    .string()
    .trim()
    .refine<HexString>((input: string): input is HexString =>
      input.startsWith('0x'),
    ),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request<{ Payload: Input }>,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Reject attestation started');

  const { rootHash } = request.payload;
  const session = getSession(request.headers);
  const { encryptionKeyUri } = session;

  logger.debug('Reject attestation rootHash found');

  const output = await encryptMessageBody(encryptionKeyUri, {
    content: rootHash,
    type: 'reject-attestation',
  });

  logger.debug('Reject attestation completed');
  return h.response(output as Output);
}

export const rejectAttestation = {
  method: 'POST',
  path: paths.verifier.rejectAttestation,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
} as ServerRoute;
