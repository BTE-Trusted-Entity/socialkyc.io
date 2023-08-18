import { useEffect, useState } from 'react';

import { DetailedMessage } from '../DetailedMessage/DetailedMessage';

const expectedDuration = 40 * 1000;

export function SlowAttestation() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSlow(true), expectedDuration);
    return () => clearTimeout(timeout);
  }, []);

  if (!slow) {
    return null; // do not show until we consider it slow
  }

  return (
    <DetailedMessage
      icon="exclamation"
      heading="Please note:"
      message="Anchoring is taking longer than expected."
      details="Shortly you will find your attested credential in your wallet."
    />
  );
}
