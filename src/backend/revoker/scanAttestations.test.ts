/**
 * @jest-environment node
 */

import { describe, it, jest } from '@jest/globals';
import { Utils, type HexString, Did } from '@kiltprotocol/sdk-js';

import { u8aToHex } from '@polkadot/util';

import { batchQueryRevoked } from './batchQueryRevoked';
import { AttestationInfo, scanAttestations } from './scanAttestations';
import { subScanEventGenerator } from './subScan';

jest.mock('../utilities/configuration', () => ({ configuration: {} }));
jest.mock('./batchQueryRevoked', () => ({
  batchQueryRevoked: jest.fn(),
}));
jest.mock('./subScan', () => ({
  subScanEventGenerator: jest.fn(),
}));

describe('scanAttestations', () => {
  it('should transform events to include revoked status', async () => {
    jest.mocked(batchQueryRevoked).mockResolvedValue({
      '0x01': false,
      '0x02': true,
      '0x03': null,
    });
    jest
      .mocked(subScanEventGenerator)
      .mockImplementation(async function* () {});

    await scanAttestations().next();

    const mockEvent = {
      block: 1,
      blockTimestampMs: 1,
      extrinsicHash: '0x01' as HexString,
    };
    const events = await jest.mocked(subScanEventGenerator).mock.calls[0][3]([
      { ...mockEvent, params: [{ type_name: 'ClaimHashOf', value: '0x01' }] },
      { ...mockEvent, params: [{ type_name: 'ClaimHashOf', value: '0x02' }] },
      { ...mockEvent, params: [{ type_name: 'ClaimHashOf', value: '0x03' }] },
    ]);

    expect(events[0].params[1].value).toBe(false);
    expect(events[1].params[1].value).toBe(true);
    expect(events[2].params[1].value).toBe(null);
  });

  it('should stop when there’s no more attestations to revoke', async () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 10);

    jest.mocked(subScanEventGenerator).mockImplementation(async function* () {
      yield {
        block: 1,
        blockTimestampMs: recentDate.getTime(),
        extrinsicHash: '0x01' as HexString,
        params: [
          { type_name: 'AttesterOf', value: '0x01' },
          { type_name: 'ClaimHashOf', value: '0x01' },
          { type_name: 'CtypeHashOf', value: '0x01' },
          { type_name: 'Option<DelegationNodeIdOf', value: null },
        ],
      };
    });

    expect((await scanAttestations().next()).done).toBe(true);
  });

  it('should process attestation events', async () => {
    const owner = 'did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQU894aY';
    const createdAt = new Date('2020-01-01');

    const attesterDidAsAccountHex = u8aToHex(
      Utils.Crypto.decodeAddress(Did.toChain(owner)),
    );

    jest.mocked(subScanEventGenerator).mockImplementation(async function* () {
      yield {
        block: 1,
        blockTimestampMs: createdAt.getTime(),
        extrinsicHash: '0x01' as HexString,
        params: [
          { type_name: 'AttesterOf', value: attesterDidAsAccountHex },
          { type_name: 'ClaimHashOf', value: '0x02' },
          { type_name: 'CtypeHashOf', value: '0x03' },
          { type_name: 'Option<DelegationNodeIdOf>', value: null },
          { type_name: 'RevocationStatus', value: false },
        ],
      };
    });

    const attestation = (await scanAttestations().next()).value;
    expect(attestation).toMatchObject<AttestationInfo>({
      owner,
      claimHash: '0x02',
      cTypeHash: '0x03',
      delegationId: null,
      revoked: false,
      createdAt,
      block: 1,
    });
  });
});
