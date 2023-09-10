/**
 * @jest-environment node
 */

import { describe, it, expect, jest } from '@jest/globals';

import { getExpiredAttestations } from './getExpiredAttestations';
import { AttestationInfo } from './scanAttestations';
import {
  attestationsToRemove,
  attestationsToRevoke,
  fillExpiredInventory,
  updateExpiredInventory,
} from './expiredInventory';

import { batchQueryRevoked } from './batchQueryRevoked';

jest.mock('../utilities/configuration', () => ({ configuration: {} }));
jest.mock('./getExpiredAttestations', () => ({
  getExpiredAttestations: jest.fn(),
}));
jest.mock('./batchQueryRevoked');

const deleteDate = new Date();
deleteDate.setMonth(deleteDate.getMonth() - (12 * 2 + 1));
const toRemove: AttestationInfo = {
  block: 1,
  cTypeHash: '0x32',
  claimHash: '0x01',
  createdAt: deleteDate,
  owner: 'did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQU894aY',
  delegationId: null,
  revoked: null,
};

const revokeDate = new Date();
revokeDate.setMonth(revokeDate.getMonth() - (12 + 1));
const toRevoke: AttestationInfo = {
  block: 2,
  cTypeHash: '0x32',
  claimHash: '0x02',
  createdAt: revokeDate,
  owner: 'did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQU894aY',
  delegationId: null,
  revoked: null,
};

jest.mocked(getExpiredAttestations).mockImplementation(async function* () {
  yield toRemove;
  yield toRevoke;
});
jest.mocked(batchQueryRevoked).mockResolvedValue({
  [toRevoke.claimHash]: true,
  [toRemove.claimHash]: null,
});

describe('expiredInventory', () => {
  describe('fillExpiredInventory', () => {
    it('should sort the attestations in appropriate lists', async () => {
      await fillExpiredInventory();

      expect(attestationsToRemove[0].claimHash).toBe('0x01');
      expect(attestationsToRevoke[0].claimHash).toBe('0x02');
    });
  });

  describe('updateExpiredInventory', () => {
    it('should remove attestations from the lists', async () => {
      attestationsToRemove.length = 0;
      attestationsToRevoke.length = 0;
      await fillExpiredInventory();
      expect(attestationsToRemove.length).toBe(1);
      expect(attestationsToRevoke.length).toBe(1);

      await updateExpiredInventory([toRemove], false);
      await updateExpiredInventory([toRevoke], true);

      expect(attestationsToRemove.length).toBe(0);
      expect(attestationsToRevoke.length).toBe(0);
    });
  });
});
