import { ReactNode } from 'react';

import { DetailedMessage } from '../DetailedMessage/DetailedMessage';

interface Props {
  spinner: boolean;
  ready: boolean;
  status?: ReactNode;
  subline?: ReactNode;
  error?: ReactNode;
}

export function AttestationProcess({
  spinner,
  ready,
  status,
  subline,
  error,
}: Props): JSX.Element {
  const icon = ready ? 'checkmark' : spinner ? 'spinner' : undefined;

  return (
    <DetailedMessage
      icon={icon}
      heading="Attestation process:"
      message={status}
      details={subline || error}
    />
  );
}
