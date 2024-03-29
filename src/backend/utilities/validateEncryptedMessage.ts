import { DidResourceUri } from '@kiltprotocol/sdk-js';
import { z } from 'zod';

import { isDidResourceUri } from './isDidResourceUri';

const zodPayload = z.object({
  message: z.object({
    receiverKeyUri: z.string().refine<DidResourceUri>(isDidResourceUri),
    senderKeyUri: z.string().refine<DidResourceUri>(isDidResourceUri),
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
