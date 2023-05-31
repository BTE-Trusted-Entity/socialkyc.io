import * as styles from './Attester.module.css';

import { Disconnect } from '../../components/Disconnect/Disconnect';

export function Attester() {
  return (
    <div>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <Disconnect session={{}} onDisconnect={() => 1} />
      <h1 className={styles.heading}>fail</h1>
    </div>
  );
}
