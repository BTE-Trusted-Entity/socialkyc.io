import { Attestation, ConfigService } from '@kiltprotocol/sdk-js';

import { AttestationInfo } from './scanAttestations';

export async function successChecker(
  attestation: AttestationInfo,
): Promise<boolean> {
  const stateBeforeProcess = attestation.state;
  let stateWishedAfterProcess: AttestationInfo['state'] = undefined;
  let realCurrentState: AttestationInfo['state'] = undefined;

  if (stateBeforeProcess === 'valid') {
    stateWishedAfterProcess = 'revoked';
  }
  if (stateBeforeProcess === 'revoked') {
    stateWishedAfterProcess = 'removed';
  }

  const api = ConfigService.get('api');

  const attestationEncoded = await api.query.attestation.attestations(
    attestation.claimHash,
  );
  if (attestationEncoded.isNone) {
    realCurrentState = 'removed';
  }

  const attestationDecoded = Attestation.fromChain(
    attestationEncoded,
    attestation.claimHash,
  );

  if (attestationDecoded.revoked === false) {
    realCurrentState = 'valid';
  }
  if (attestationDecoded.revoked === true) {
    realCurrentState = 'revoked';
  }

  if (!realCurrentState || !stateWishedAfterProcess) {
    throw new Error('State could not be assigned');
  }
  return realCurrentState === stateWishedAfterProcess;
}
