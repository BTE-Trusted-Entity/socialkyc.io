import { ConfigService } from '@kiltprotocol/sdk-js';

import { type AttestationInfo } from './scanAttestations';
import { shouldBeRemoved } from './stateIdentifiers';

export function getExpirationTx(attestation: AttestationInfo) {
  const api = ConfigService.get('api');
  return shouldBeRemoved(attestation)
    ? api.tx.attestation.remove(attestation.claimHash, null)
    : api.tx.attestation.revoke(attestation.claimHash, null);
}
