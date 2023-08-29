/**
 * @jest-environment node
 */

import { describe, it } from '@jest/globals';

import { subScanEventGenerator } from './subScan';
import { scanAttestations } from './scanAttestations';

describe('scan for first event on chain through subscan', () => {
  it('should always be the same on peregrine. Can not change the past.', async () => {
    const aSubscanEvent = subScanEventGenerator(
      'attestation',
      'AttestationCreated',
      0,
    );

    const firstEvent = {
      block: 34704,
      blockTimestampMs: 1644921078000,
      extrinsicHash:
        '0x664338b7226842d232d5f20c0881c79816e11f15175babb7cf86c15df04ad817',
      params: [
        {
          type: '[U8; 32]',
          type_name: 'AttesterOf',
          value:
            '0x4cc0738704a6e0ae96ae60f32d5cc666a2ff12f11f3fc03efa12e3111c1e4d52',
        },
        {
          type: 'H256',
          type_name: 'ClaimHashOf',
          value:
            '0x8c0b0cfeb3ab74af38c2a65e6e6e1bd7437d508c66bf627c23e2b969c9e62129',
        },
        {
          type: 'H256',
          type_name: 'CtypeHashOf',
          value:
            '0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac',
        },
        {
          type: 'option<H256>',
          type_name: 'Option<DelegationNodeIdOf>',
          value: null,
        },
      ],
    };

    expect((await aSubscanEvent.next()).value).toMatchObject(firstEvent);
  });
});

describe('get the first attestation as an info-object from the chain', () => {
  it('should always be the same on peregrine. Can not change the past.', async () => {
    const oneAttestationInfo = scanAttestations(0);

    const firstAttestationInfo = {
      block: 34704,
      cTypeId:
        'kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac',
      claimHash:
        '0x8c0b0cfeb3ab74af38c2a65e6e6e1bd7437d508c66bf627c23e2b969c9e62129',
      createdAt: new Date('2022-02-15T10:31:18.000Z'),
      extrinsicHash:
        '0x664338b7226842d232d5f20c0881c79816e11f15175babb7cf86c15df04ad817',
      owner: 'did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQU894aY',
    };

    expect((await oneAttestationInfo.next()).value).toMatchObject(
      firstAttestationInfo,
    );
  });
});
