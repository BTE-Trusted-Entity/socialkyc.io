import type { HexString } from '@kiltprotocol/types';

import { ConfigService } from '@kiltprotocol/sdk-js';

import { Attestation } from '@kiltprotocol/credentials';

import { initKilt } from '../utilities/initKilt';

/**
 * Queries the revoked status of an array of attestations from the blockchain in batches.
 * @param claimHashes
 * @returns Map of claimHashes to revoked status (null means removed from the blockchain)
 */
export async function batchQueryRevoked(
  claimHashes: HexString[],
): Promise<{ [claimHash: HexString]: boolean | null }> {
  await initKilt();
  const api = ConfigService.get('api');

  const results = await api.query.attestation.attestations.multi(claimHashes);

  return Object.fromEntries(
    results.map((encoded, index) => {
      const claimHash = claimHashes[index];
      if (encoded.isNone) {
        return [claimHash, null];
      }
      return [claimHash, Attestation.fromChain(encoded, claimHash).revoked];
    }),
  );
}
