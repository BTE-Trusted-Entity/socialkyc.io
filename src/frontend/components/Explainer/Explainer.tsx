import { useState, useCallback, useRef } from 'react';

import { useHandleOutsideClick } from '../../utilities/useHandleOutsideClick';

import * as styles from './Explainer.module.css';

interface Props {
  children: JSX.Element;
}

export function Explainer({ children }: Props): JSX.Element {
  const [showExplainer, setShowExplainer] = useState(false);

  const handleToggleExplainer = useCallback(() => {
    setShowExplainer(!showExplainer);
  }, [showExplainer]);

  const explainerRef = useRef();
  useHandleOutsideClick(explainerRef, () => setShowExplainer(false));

  return (
    <div className={styles.explainerContainer} ref={explainerRef}>
      <button
        type="button"
        aria-label="explanation"
        className={styles.toggleExplainer}
        onClick={handleToggleExplainer}
      ></button>
      {showExplainer && children}
    </div>
  );
}
