import { z } from 'zod';

const zodPayload = z.object({
  receiverKeyId: z.string(),
  senderKeyId: z.string(),
  ciphertext: z.string(),
  nonce: z.string(),
  receivedAt: z.number().optional(),
});

export type Payload = z.infer<typeof zodPayload>;

export async function validateEncryptedMessage(
  payload: Parameters<typeof zodPayload.parse>[0],
): Promise<void> {
  zodPayload.parse(payload);
}
