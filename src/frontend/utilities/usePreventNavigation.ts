import { useEffect } from 'react';

function handleBeforeUnload(event: Event): void {
  event.preventDefault();
  event.returnValue = false;
}

function addUnloadListener(): void {
  window.addEventListener('beforeunload', handleBeforeUnload);
}

function removeUnloadListener(): void {
  window.removeEventListener('beforeunload', handleBeforeUnload);
}

export function usePreventNavigation(active: boolean): void {
  useEffect(() => {
    if (active) {
      addUnloadListener();
    } else {
      removeUnloadListener();
    }
  }, [active]);
}
