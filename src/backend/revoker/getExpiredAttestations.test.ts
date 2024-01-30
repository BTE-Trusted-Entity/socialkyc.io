/**
 * @jest-environment node
 */
import type { Did } from '@kiltprotocol/types';

import { describe, it, expect, jest } from '@jest/globals';

import { configuration } from '../utilities/configuration';

import { AttestationInfo, scanAttestations } from './scanAttestations';
import { getExpiredAttestations } from './getExpiredAttestations';

jest.mock('../utilities/configuration', () => ({
  configuration: { subscan: {} },
}));
jest.mock('./scanAttestations');

describe('getExpiredAttestations', () => {
  it('should emit our existing attestations', async () => {
    const attestation: AttestationInfo = {
      block: 1,
      cTypeHash: '0x32',
      claimHash: '0x01',
      createdAt: new Date('2020-01-01'),
      owner: configuration.did as Did,
      delegationId: null,
      revoked: false,
    };
    jest.mocked(scanAttestations).mockImplementation(async function* () {
      yield attestation;
    });

    expect((await getExpiredAttestations().next()).value).toBe(attestation);
  });

  it('should filter out attestations by others', async () => {
    jest.mocked(scanAttestations).mockImplementation(async function* () {
      yield <AttestationInfo>{
        block: 1,
        cTypeHash: '0x32',
        claimHash: '0x01',
        createdAt: new Date('2020-01-01'),
        owner: 'did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare',
        delegationId: null,
        revoked: false,
      };
    });

    expect((await getExpiredAttestations().next()).done).toBe(true);
  });

  it('should filter out removed attestations', async () => {
    jest.mocked(scanAttestations).mockImplementation(async function* () {
      yield <AttestationInfo>{
        block: 1,
        cTypeHash: '0x32',
        claimHash: '0x01',
        createdAt: new Date('2020-01-01'),
        owner: configuration.did as Did,
        delegationId: null,
        revoked: null,
      };
    });

    expect((await getExpiredAttestations().next()).done).toBe(true);
  });
});
