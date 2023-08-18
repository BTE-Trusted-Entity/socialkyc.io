import { DetailedMessage } from '../DetailedMessage/DetailedMessage';

export function AttestationProcessReady() {
  return (
    <DetailedMessage
      icon="checkmark"
      heading="Attestation process:"
      message="Credential is ready"
      details="We recommend that you back up your credential now."
    />
  );
}
