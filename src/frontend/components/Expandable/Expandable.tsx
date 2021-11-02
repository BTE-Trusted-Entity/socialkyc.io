import { ReactNode } from 'react';
import { useLocation, Link, Route, Prompt } from 'react-router-dom';
import cx from 'classnames';

import * as styles from './Expandable.module.css';

interface Props {
  path: string;
  label: string;
  processing: boolean;
  children: ReactNode;
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
        <Route path={path}>
          <Prompt
            when={processing}
            message={`The ${label} attestation process has already started. Are you sure you want to leave?`}
          />
          {children}
        </Route>
      </section>
    </li>
  );
}
