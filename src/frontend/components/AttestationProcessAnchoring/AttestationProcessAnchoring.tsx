import { Fragment } from 'react';

import { DetailedMessage } from '../DetailedMessage/DetailedMessage';
import { SlowAttestation } from '../SlowAttestation/SlowAttestation';

export function AttestationProcessAnchoring() {
  return (
    <Fragment>
      <DetailedMessage
        icon="spinner"
        heading="Attestation process:"
        message="Anchoring credential on KILT blockchain"
        details="Please leave this tab open until your credential is attested."
      />
      <SlowAttestation />
    </Fragment>
  );
}
