import { ReactNode } from 'react';

import * as styles from './AttestationProcess.module.css';

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
  return (
    <div className={styles.container}>
      {spinner && <div className={styles.spinner} />}
      {ready && <div className={styles.ready} />}

      <h2 className={styles.heading}>Attestation process:</h2>

      {status && <p className={styles.status}>{status}</p>}
      {subline && <p className={styles.subline}>{subline}</p>}

      {/* TODO: Interface for error */}
      {error && <p>{error}</p>}
    </div>
  );
}
