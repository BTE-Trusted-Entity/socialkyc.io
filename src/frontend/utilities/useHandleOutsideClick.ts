import { MutableRefObject, useEffect } from 'react';

export function useHandleOutsideClick(
  ref: MutableRefObject<HTMLElement | null>,
  callback: () => void,
): void {
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        ref.current &&
        event.target instanceof Node &&
        !ref.current.contains(event.target)
      ) {
        callback();
      }
    }
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [ref, callback]);
}
