import { MouseEventHandler, RefObject, useCallback, useState } from 'react';

import * as styles from './useCopyButton.module.css';

interface UseCopyButton {
  supported: boolean;
  handleCopyClick: MouseEventHandler;
  className: string;
  title: string;
  justCopied: boolean;
}

export function useCopyButton(
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
): UseCopyButton {
  const writeTextSupported =
    navigator.clipboard && 'writeText' in navigator.clipboard;
  const supported =
    writeTextSupported || document.queryCommandSupported('copy');

  const [justCopied, setJustCopied] = useState(false);
  const className = justCopied ? styles.copied : styles.copy;

  const handleCopyClick = useCallback(async () => {
    const input = inputRef.current;
    if (!input || !supported) {
      return;
    }

    if (writeTextSupported) {
      await navigator.clipboard.writeText(input.value);
    } else {
      input.select();
      document.execCommand('copy');
    }

    setJustCopied(true);
    setTimeout(() => {
      setJustCopied(false);
    }, 500);
  }, [inputRef, supported, writeTextSupported]);

  return {
    supported,
    handleCopyClick,
    className,
    title: 'Copy',
    justCopied,
  };
}
