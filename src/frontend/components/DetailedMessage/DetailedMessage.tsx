import { ReactNode } from 'react';

import * as styles from './DetailedMessage.module.css';

interface Props {
  icon?: 'checkmark' | 'exclamation' | 'spinner';
  heading?: ReactNode;
  message?: ReactNode;
  details?: ReactNode;
}

const classNames = {
  spinner: styles.spinner,
  exclamation: styles.exclamation,
  checkmark: styles.checkmark,
};

export function DetailedMessage({ icon, heading, message, details }: Props) {
  const iconClassName = icon && classNames[icon];

  return (
    <section className={styles.container}>
      {iconClassName && <div className={iconClassName} />}

      <h2 className={styles.heading}>{heading}</h2>
      {message && <p className={styles.message}>{message}</p>}

      {details && <p>{details}</p>}
    </section>
  );
}
