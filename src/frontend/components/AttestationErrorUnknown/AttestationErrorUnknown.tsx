import { DetailedMessage } from '../DetailedMessage/DetailedMessage';

export function AttestationErrorUnknown(): JSX.Element {
  return (
    <DetailedMessage
      icon="exclamation"
      heading="Attestation error:"
      message="Something went wrong!"
      details="Click “Try Again” or reload the page or restart your browser."
    />
  );
}
