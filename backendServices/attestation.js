import { Attestation, AttestedClaim, Identity, init } from '@kiltprotocol/core';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';

// Peregrine chain does not support the old Kilt Identities.
// Attestations can only be done with DIDs on this chain.
// Code below will not work until refactored to use DIDs.

export async function attestClaim(request) {
  await init({ address: 'wss://kilt-peregrine-stg.kilt.io' });

  const demoIdentity = Identity.buildFromMnemonic(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );

  const demoPublicIdentity = demoIdentity.getPublicIdentity();

  const attestation = Attestation.fromRequestAndPublicIdentity(
    request,
    demoPublicIdentity,
  );

  const tx = await attestation.store();

  await BlockchainUtils.signAndSubmitTx(tx, demoIdentity);

  const attestedClaim = AttestedClaim.fromRequestAndAttestation(
    request,
    attestation,
  );
  return attestedClaim.attestation;
}
