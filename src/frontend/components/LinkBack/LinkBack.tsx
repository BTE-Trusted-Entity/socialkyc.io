import { Link } from 'react-router-dom';

import * as styles from './LinkBack.module.css';

import { paths } from '../../paths';

export function LinkBack() {
  return (
    <Link to={paths.home} className={styles.link}>
      Back to list
    </Link>
  );
}
