/**
 * @jest-environment node
 */

import { describe, it } from '@jest/globals';

import { scanForOldCredentials } from './scanForOldCredentials';
import { prepareRevocations, prepareRemovals } from './prepareTransactions';

describe('scan for old credential attestations', () => {
  it('for the first 100.000 Bl, there should be 6 attestations on peregrine', async () => {
    const extrinsicsHashesArray = await scanForOldCredentials(0, 100000, true);

    expect(extrinsicsHashesArray.length).toBe(6);
  });
});

describe('prepare transactions to revoke', () => {
  it('for the first 100.000 Bl, there should be 6 attestations on peregrine', async () => {
    const submittableExtrinsics = await prepareRevocations(0, 100000);

    expect(submittableExtrinsics.length).toBe(6);
  });
});
describe('prepare transactions to remove', () => {
  it('for the first 100.000 Bl, there should be 6 attestations on peregrine', async () => {
    const submittableExtrinsics = await prepareRemovals(0, 100000);

    expect(submittableExtrinsics.length).toBe(6);
  });
});
