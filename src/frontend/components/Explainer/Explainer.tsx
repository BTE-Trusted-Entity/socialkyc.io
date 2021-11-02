import { useState, useCallback, useRef, ReactNode } from 'react';

import { useHandleOutsideClick } from '../../utilities/useHandleOutsideClick';

import * as styles from './Explainer.module.css';

interface Props {
  children: ReactNode;
}

export function Explainer({ children }: Props): JSX.Element {
  const [showExplainer, setShowExplainer] = useState(false);

  const hideExplainer = useCallback(() => setShowExplainer(false), []);

  const handleToggleExplainer = useCallback(() => {
    setShowExplainer(!showExplainer);
  }, [showExplainer]);

  const explainerRef = useRef();
  useHandleOutsideClick(explainerRef, hideExplainer);

  return (
    <div className={styles.explainerContainer} ref={explainerRef}>
      <button
        type="button"
        aria-label="Toggle explanation"
        className={styles.toggleExplainer}
        onClick={handleToggleExplainer}
      ></button>
      {showExplainer && <p className={styles.explainer}>{children}</p>}
    </div>
  );
}
