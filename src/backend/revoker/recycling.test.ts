/**
 * @jest-environment node
 */

import { describe, it } from '@jest/globals';

import { configuration } from '../utilities/configuration';

import { subScanEventGenerator } from './subScan';
import { AttestationInfo, scanAttestations } from './scanAttestations';
import { getExpiredCredentials } from './getExpiredCredentials';
import { readCurrentStates } from './stateIdentifiers';

describe('scan for first event on chain through subscan', () => {
  it('should always be the same on peregrine. Can not change the past.', async () => {
    const subscanAttestationsEvents = subScanEventGenerator(
      'attestation',
      'AttestationCreated',
      0,
    );

    const firstEventHardCoded = {
      block: 28500,
      blockTimestampMs: 1644844776000,
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
            '0xc11239b76188eab173db38c253b462a087388cab49fbdcb16357d6130d7d7be1',
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
      extrinsicHash:
        '0x4e406574dcdadef6e742d9a8d41bbe699840110b21f5ae83d45d4e44ae3638a7',
    };

    const firstEventGenerated = await subscanAttestationsEvents.next();

    expect(firstEventGenerated.value).toMatchObject(firstEventHardCoded);
  });
});

describe('get the first attestation as an info-object from the chain', () => {
  it('should always be the same on peregrine. Can not change the past.', async () => {
    const attestationsGenerator = scanAttestations(0);

    const firstAttestationInfo: AttestationInfo = {
      block: 28500,
      cTypeHash:
        '0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac',
      claimHash:
        '0xc11239b76188eab173db38c253b462a087388cab49fbdcb16357d6130d7d7be1',
      createdAt: new Date('2022-02-14T13:19:36.000Z'),
      owner: 'did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQU894aY',
      delegationId: null,
    };

    const oneAttestationInfo = await attestationsGenerator.next();

    expect(oneAttestationInfo.value).toMatchObject(firstAttestationInfo);
  });
});

describe('get the first attestationInfo for a revocation/removal', () => {
  it('should have the correct identity and validity state', async () => {
    const expiredCredentialGenerator = getExpiredCredentials(0);

    const firstAttestation = (await expiredCredentialGenerator.next())
      .value as AttestationInfo;

    const did = firstAttestation.owner;
    const validityState = (await readCurrentStates([firstAttestation]))[0];

    expect(did).toEqual(configuration.did);
    expect(['valid', 'revoked']).toContain(validityState);
  });
});
