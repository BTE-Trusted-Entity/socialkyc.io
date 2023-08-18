import { PropsWithChildren, useCallback, useRef, useState } from 'react';

import * as styles from './Explainer.module.css';

import { useHandleOutsideClick } from '../../utilities/useHandleOutsideClick';

export function Explainer({ children }: PropsWithChildren) {
  const [showExplainer, setShowExplainer] = useState(false);

  const hideExplainer = useCallback(() => setShowExplainer(false), []);

  const handleToggleExplainer = useCallback(() => {
    setShowExplainer(!showExplainer);
  }, [showExplainer]);

  const explainerRef = useRef(null);
  useHandleOutsideClick(explainerRef, hideExplainer);

  return (
    <div className={styles.explainerContainer} ref={explainerRef}>
      <button
        type="button"
        aria-label="Toggle explanation"
        className={showExplainer ? styles.hideExplainer : styles.showExplainer}
        onClick={handleToggleExplainer}
      />
      {showExplainer && <p className={styles.explainer}>{children}</p>}
    </div>
  );
}
