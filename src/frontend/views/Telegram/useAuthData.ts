import { useEffect, useState } from 'react';

export function useAuthData() {
  const [authData, setAuthData] = useState<string>();

  useEffect(() => {
    async function handleMessage({ data, origin }: MessageEvent) {
      try {
        if (
          origin === 'https://oauth.telegram.org' &&
          JSON.parse(data).event === 'auth_user'
        ) {
          setAuthData(data);
        }
      } catch {
        // ignore the errors, may come from unrelated events
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return authData;
}
