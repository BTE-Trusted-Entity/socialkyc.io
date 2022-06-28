import { DidResourceUri } from '@kiltprotocol/types';
import { z } from 'zod';

const zodPayload = z.object({
  message: z.object({
    receiverKeyUri: z.custom<DidResourceUri>(),
    senderKeyUri: z.custom<DidResourceUri>(),
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
