import { DidChain, DidUtils, FullDidDetails } from '@kiltprotocol/did';
import {
  IIdentity,
  KeyRelationship,
  KeystoreSigner,
  SubmittableExtrinsic,
} from '@kiltprotocol/types';

import { authenticationKeystore } from './keystores';

const { authentication, assertionMethod } = KeyRelationship;

// TODO: replace with authorizeBatch when SDK delivers it
export async function didAuthorizeBatchExtrinsic(
  fullDid: FullDidDetails,
  call: SubmittableExtrinsic,
  signer: KeystoreSigner,
  submitter: IIdentity['address'],
): Promise<SubmittableExtrinsic> {
  const relationship =
    signer === authenticationKeystore ? authentication : assertionMethod;

  const [signingKey] = fullDid.getKeys(relationship);
  if (!signingKey) {
    throw new Error('Own signing key absent');
  }

  const txCounter = fullDid.getNextTxIndex();

  return await DidChain.generateDidAuthenticatedTx({
    didIdentifier: fullDid.identifier,
    signingPublicKey: signingKey.publicKeyHex,
    alg: DidUtils.getSignatureAlgForKeyType(signingKey.type),
    signer,
    call,
    txCounter,
    submitter,
  });
}
