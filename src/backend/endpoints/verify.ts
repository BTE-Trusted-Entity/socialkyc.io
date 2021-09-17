import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { IMessage, MessageBodyType } from '@kiltprotocol/types';
import { AttestedClaim } from '@kiltprotocol/core';
import { errorCheckMessageBody } from '@kiltprotocol/messaging';

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const message = request.payload as IMessage;

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
      payload: async () => {
        // RequestForAttestation.isIRequestForAttestation(payload);
        // TODO: validator for IMessage
      },
    },
  },
};
