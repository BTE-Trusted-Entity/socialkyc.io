import { useState } from 'react';

import { Session } from '../../utilities/session';

import { AttestationStatus, DiscordTemplate } from './DiscordTemplate';

interface Props {
  session: Session;
}

export function Discord({ session }: Props): JSX.Element {
  const initialStatus = 'none';

  const [status, setStatus] = useState<AttestationStatus>(initialStatus);

  const [processing, setProcessing] = useState(false);

  return <DiscordTemplate status={status} processing={processing} />;
}
