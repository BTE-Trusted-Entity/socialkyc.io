import { DidResourceUri } from '@kiltprotocol/types';
import { z } from 'zod';

import { isDidResourceUri } from './isDidResourceUri';

const zodPayload = z.object({
  message: z.object({
    receiverKeyUri: z
      .string()
      .refine<DidResourceUri>((arg): arg is DidResourceUri =>
        isDidResourceUri(arg),
      ),
    senderKeyUri: z
      .string()
      .refine<DidResourceUri>((arg): arg is DidResourceUri =>
        isDidResourceUri(arg),
      ),
    ciphertext: z.string(),
    nonce: z.string(),
    receivedAt: z.number().optional(),
  }),
});

export type EncryptedMessageInput = z.infer<typeof zodPayload>;

export async function validateEncryptedMessage(
  payload: Parameters<typeof zodPayload.parse>[0],
): Promise<void> {
  zodPayload.parse(payload);
}
