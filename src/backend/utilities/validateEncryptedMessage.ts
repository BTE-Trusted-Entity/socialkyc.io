import type { DidUrl } from '@kiltprotocol/types';

import { z } from 'zod';

import { isDidUrl } from './isDidUrl';

const zodPayload = z.object({
  message: z.object({
    receiverKeyUri: z.string().refine<DidUrl>(isDidUrl),
    senderKeyUri: z.string().refine<DidUrl>(isDidUrl),
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
