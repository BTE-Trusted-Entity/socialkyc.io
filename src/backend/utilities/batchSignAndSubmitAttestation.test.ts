/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, it, jest, expect } from '@jest/globals';
import { Attestation } from '@kiltprotocol/core';
import { randomAsHex } from '@polkadot/util-crypto';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';

jest.mock('@kiltprotocol/core', () => {
  const orig = jest.requireActual('@kiltprotocol/core');

  // @ts-ignore
  const origAttestation = orig.Attestation;
  origAttestation.query = () => {
    return Promise.resolve(null);
  };

  return {
    __esModule: true,
    // @ts-ignore
    ...orig,
    Attestation: origAttestation,
  };
});
jest.mock('@kiltprotocol/chain-helpers', () => {
  return {
    BlockchainApiConnection: {
      getConnectionOrConnect: () => {
        return {
          api: {},
        };
      },
    },
    BlockchainUtils: {
      signAndSubmitTx: () =>
        new Promise((resolve, reject) => {
          setTimeout(() => reject('failure'), 1000);
        }),
    },
  };
});
jest.mock('@kiltprotocol/did', () => {
  return {
    FullDidDetails: {
      fromChainInfo: () => Promise.resolve(true),
    },
    Utils: {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      validateKiltDidUri: () => {},
    },
    DidBatchBuilder: class {
      extrinsics: any[] = [];
      addMultipleExtrinsics(extrinsics: any) {
        this.extrinsics = extrinsics;
        return this;
      }
      async build() {
        return this.extrinsics;
      }
    },
  };
});
jest.mock('./configuration');
jest.mock('./logger', () => ({
  logger: {
    fatal: console.error,
    error: console.error,
    debug: console.log,
  },
}));
jest.mock('./fullDid', () => ({
  fullDidPromise: Promise.resolve({
    fullDid: {},
  }),
}));
jest.mock('./signAndSubmit', () => {
  return {
    signAndSubmit: () =>
      new Promise((resolve) => {
        setTimeout(() => resolve('Done'), 1000);
      }),
  };
});

import { batchSignAndSubmitAttestation } from './batchSignAndSubmitAttestation';

function makeAttestation(claimHash: `0x${string}`) {
  const att = new Attestation({
    claimHash,
    cTypeHash:
      '0x568ec5ffd7771c4677a5470771adcdea1ea4d6b566f060dc419ff133a0089d80',
    owner: 'did:kilt:light:004rzcHqKvv6TbsA46VpG53JrvdzRr6ccyboUNeCGTvDw2AozU',
    revoked: false,
    delegationId: '',
  });
  // @ts-ignore
  att.getStoreTx = () => Promise.resolve(claimHash);
  return att;
}

describe('batchSignAndSubmitAttestation', () => {
  it('does not fail', () => {
    return new Promise((done, rejectOuter) => {
      const attestation = makeAttestation(randomAsHex());
      batchSignAndSubmitAttestation(attestation).catch(console.error);

      const existing = randomAsHex();
      const existingAtt = makeAttestation(existing);
      console.log('existing', existing);
      const failing = randomAsHex();
      console.log('failing', failing);
      const failingAtt = makeAttestation(failing);

      // @ts-ignore
      // eslint-disable-next-line import/namespace
      BlockchainUtils.signAndSubmitTx = (tx) => {
        console.log(tx);
        // @ts-ignore
        const foundExisting = tx.some((claimHash) => {
          return claimHash === existing;
        });
        // @ts-ignore
        const foundMultipleFailing =
          tx.length > 1 &&
          // @ts-ignore
          tx.every((claimHash) => {
            return claimHash === failing;
          });

        if (foundExisting) {
          return new Promise((resolve, reject) => {
            setTimeout(() => reject('Already Attested'), 1000);
          });
        }

        if (foundMultipleFailing) {
          rejectOuter('Should not reach here');
          return Promise.resolve('foundMultipleFailing');
        }

        done('done');
        return Promise.resolve(true);
      };
      // @ts-ignore
      Attestation.query = async (att) => {
        return att === existing;
      };
      batchSignAndSubmitAttestation(existingAtt).catch(console.error);
      batchSignAndSubmitAttestation(failingAtt).catch(console.error);

      setTimeout(async () => {
        await batchSignAndSubmitAttestation(failingAtt).catch(console.error);
        done('done');
      }, 1500);

      expect(true).toBeTruthy();
    });
  });
});
