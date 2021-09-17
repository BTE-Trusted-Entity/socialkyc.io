import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { MessageBodyType } from '@kiltprotocol/types';
import { AttestedClaim } from '@kiltprotocol/core';
import { errorCheckMessageBody } from '@kiltprotocol/messaging';

import { decryptMessage } from '../utilities/decryptMessage';
import {
  Payload,
  validateEncryptedMessage,
} from '../utilities/validateEncryptedMessage';

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const encrypted = request.payload as Payload;
  const message = await decryptMessage(encrypted);

  const messageBody = message.body;
  errorCheckMessageBody(messageBody);

  if (messageBody.type !== MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES) {
    return h.response().code(StatusCodes.NOT_ACCEPTABLE);
  }

  const attestedClaims = messageBody.content.map((attestedClaimData) =>
    AttestedClaim.fromAttestedClaim(attestedClaimData),
  );
  for (const attestedClaim of attestedClaims) {
    const isValid = await attestedClaim.verify();
    console.log('Valid:', isValid, 'Claim:', attestedClaim);
  }

  return h.response(attestedClaims);
}

export const verify: ServerRoute = {
  method: 'POST',
  path: '/verify',
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};
