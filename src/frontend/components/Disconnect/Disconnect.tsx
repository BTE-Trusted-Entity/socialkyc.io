import { useCallback } from 'react';

import { useHistory } from 'react-router-dom';

import * as styles from './Disconnect.module.css';

import { Session } from '../../utilities/session';
import { paths } from '../../paths';

interface Props {
  session: Session;
  onDisconnect: () => void;
}

export function Disconnect({ session, onDisconnect }: Props): JSX.Element {
  const history = useHistory();

  const handleClick = useCallback(async () => {
    const before = history.length;

    history.push(paths.home);

    // If navigation was blocked, do not continue
    if (history.length === before) {
      return;
    }

    await session.close();
    onDisconnect();
  }, [session, onDisconnect, history]);

  return (
    <div className={styles.disconnectContainer}>
      <p>Connected wallet: {session.name}</p>
      <button type="button" className={styles.disconnect} onClick={handleClick}>
        Disconnect
      </button>
    </div>
  );
}
