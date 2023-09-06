import {
  Attestation,
  ConfigService,
  type HexString,
} from '@kiltprotocol/sdk-js';

import { initKilt } from '../utilities/initKilt';

/**
 * Queries the revoked status of an array of attestations from the blockchain in bulk
 * @param claimHashes
 * @returns Matching array of revoked values
 */
export async function bulkQueryRevoked(claimHashes: HexString[]) {
  await initKilt();
  const api = ConfigService.get('api');

  const results = await api.query.attestation.attestations.multi(claimHashes);

  return results.map((encoded, index) => {
    if (encoded.isNone) {
      return null;
    }
    return Attestation.fromChain(encoded, claimHashes[index]).revoked;
  });
}

export function shouldBeRemoved({ createdAt }: { createdAt: Date }) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 2); // remove attestations older than 2 years
  return createdAt < cutoff;
}

export function shouldBeRevoked({ createdAt }: { createdAt: Date }) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1); // revoke attestations older than 1 year
  return createdAt < cutoff;
}
