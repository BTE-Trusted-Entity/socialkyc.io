/**
 * @jest-environment node
 */

import { describe, it } from '@jest/globals';

import { SubmittableExtrinsic } from '@kiltprotocol/sdk-js';

import { configuration } from '../utilities/configuration';

import { subScanEventGenerator } from './subScan';
import { scanAttestations } from './scanAttestations';
import { generateTransactions } from './generateTransactions';

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

    const firstAttestationInfo = {
      block: 28500,
      cTypeId:
        'kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac',
      claimHash:
        '0xc11239b76188eab173db38c253b462a087388cab49fbdcb16357d6130d7d7be1',
      createdAt: new Date('2022-02-14T13:19:36.000Z'),
      extrinsicHash:
        '0x4e406574dcdadef6e742d9a8d41bbe699840110b21f5ae83d45d4e44ae3638a7',
      owner: 'did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQU894aY',
      state: undefined,
    };

    const oneAttestationInfo = await attestationsGenerator.next();

    expect(oneAttestationInfo.value).toMatchObject(firstAttestationInfo);
  });
});

describe('get the first submittable extrinsic for a revocation/removal', () => {
  it('should have the correct identity and account', async () => {
    const submittableExtrinsicsGenerator = generateTransactions(0);

    const firstCondemnation = (await submittableExtrinsicsGenerator.next())
      .value as SubmittableExtrinsic;

    interface keyableObject {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    }

    const someInnerInfo =
      firstCondemnation.inner.method.args[0].toJSON() as keyableObject;

    const did = `did:kilt:${someInnerInfo['did']}`;
    const submitter = someInnerInfo['submitter'];

    expect(did).toEqual(configuration.subscan.socialKYCDidUri);
    expect(submitter).toBe(configuration.subscan.socialKYCAddress);
  });
});
