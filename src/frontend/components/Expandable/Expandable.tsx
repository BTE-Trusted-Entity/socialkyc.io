import { useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import cx from 'classnames';

import * as styles from './Expandable.module.css';
import { useHandleOutsideClick } from '../../utilities/useHandleOutsideClick';

interface Props {
  expanded: boolean;
  processing: boolean;
  children: JSX.Element;
}

export function Expandable({
  expanded,
  processing,
  children,
}: Props): JSX.Element {
  const history = useHistory();

  const closeExpanded = useCallback(() => {
    if (expanded && !processing) {
      history.push('/');
    }
  }, [expanded, processing, history]);

  const ref = useRef();
  useHandleOutsideClick(ref, closeExpanded);

  return (
    <li className={styles.container} ref={ref}>
      {expanded && processing && <div className={styles.spinner}></div>}

      <section
        className={cx(styles.expandableItem, {
          [styles.expanded]: expanded,
          [styles.processing]: processing && expanded,
        })}
      >
        {children}
      </section>
    </li>
  );
}
