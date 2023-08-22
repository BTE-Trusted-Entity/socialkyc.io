/**
 * @jest-environment node
 */

import { describe, it } from '@jest/globals';

import { scanForOldCredentials } from './scanForOldCredentials';

describe('scan for old credential attestations', () => {
  it('for the first 100.000, there should be 6 attestations on peregrine', async () => {
    const extrinsicsHashesArray = await scanForOldCredentials(0, 100000, true);

    expect(extrinsicsHashesArray.length).toBe(6);
  });
});
