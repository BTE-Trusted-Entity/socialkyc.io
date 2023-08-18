import { DetailedMessage } from '../DetailedMessage/DetailedMessage';

export function SigningErrorClosed() {
  return (
    <DetailedMessage
      icon="exclamation"
      heading="Signing error:"
      message="Your wallet was closed before the request was signed."
      details="Click “Continue in Wallet” to try again."
    />
  );
}
