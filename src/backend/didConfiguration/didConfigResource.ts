import {
  createCredential,
  didConfigResourceFromCredentials,
} from '@kiltprotocol/extension-api/wellKnownDidConfiguration';

import { configuration } from '../utilities/configuration';
import {
  fullDidPromise,
  getAssertionMethodSigners,
} from '../utilities/fullDid';
import { exitOnError } from '../utilities/exitOnError';

export const didConfigResourcePromise = (async () => {
  await fullDidPromise;

  if (configuration.did === 'pending') {
    throw new Error('Own DID not found');
  }

  const signers = await getAssertionMethodSigners();

  const domainLinkageCredential = await createCredential(
    signers,
    configuration.baseUri,
    configuration.did,
    { proofType: 'KILTSelfSigned2020' },
  );

  return didConfigResourceFromCredentials([domainLinkageCredential]);
})();

didConfigResourcePromise.catch(exitOnError);
