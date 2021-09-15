import { CType } from '@kiltprotocol/core';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';
import {
  getKeypairByBackupPhrase,
  deriveDidAuthenticationKeypair,
} from '../utilities/did';

/** Run this function once to store the CType */
export async function storeEmailCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Email',
    properties: {
      'Full name': {
        type: 'string',
      },
      Email: {
        type: 'string',
      },
    },
    type: 'object',
  });

  const tx = await draft.store();

  const identityKeypair = getKeypairByBackupPhrase(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );

  const didKeypair = deriveDidAuthenticationKeypair(identityKeypair);

  await BlockchainUtils.signAndSubmitTx(tx, didKeypair);

  console.log('Pass this object to CType.fromCType', draft);
}

// This object was logged by storeEmailCType()
export const email = CType.fromCType({
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Email',
    properties: {
      'Full name': {
        type: 'string',
      },
      Email: {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0xbfad60977bc18cf9dfd76da88624ce219361f337b4332d5c42c047499f4b93c7',
  },
  owner: null,
  hash: '0xbfad60977bc18cf9dfd76da88624ce219361f337b4332d5c42c047499f4b93c7',
});
