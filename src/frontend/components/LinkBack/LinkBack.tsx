import { Link } from 'react-router-dom';

import { paths } from '../../paths';

import * as styles from './LinkBack.module.css';

export function LinkBack(): JSX.Element {
  return (
    <Link to={paths.home} className={styles.link}>
      Back to list
    </Link>
  );
}
