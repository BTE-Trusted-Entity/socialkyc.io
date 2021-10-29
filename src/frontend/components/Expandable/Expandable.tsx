import { useLocation, Link } from 'react-router-dom';
import cx from 'classnames';

import * as styles from './Expandable.module.css';

interface Props {
  path: string;
  label: string;
  processing: boolean;
  children: JSX.Element | JSX.Element[];
}

export function Expandable({
  path,
  label,
  processing,
  children,
}: Props): JSX.Element {
  const { pathname } = useLocation();
  const expanded = pathname === path;

  return (
    <li className={styles.container}>
      {expanded && processing && <div className={styles.spinner}></div>}

      <section
        className={cx(styles.expandableItem, {
          [styles.expanded]: expanded,
          [styles.processing]: processing && expanded,
        })}
      >
        {expanded && (
          <Link to="/" className={styles.open}>
            {label}
          </Link>
        )}

        {!expanded && (
          <Link to={path} className={styles.closed}>
            {label}
          </Link>
        )}
        {children}
      </section>
    </li>
  );
}
