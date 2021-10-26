import { MutableRefObject, useEffect } from 'react';

export function useHandleOutsideClick(
  ref: MutableRefObject<HTMLElement>,
  callback: () => void,
): void {
  useEffect(() => {
    function handleOutsideClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [ref, callback]);
}
