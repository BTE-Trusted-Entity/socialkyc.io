import { useEffect, useState } from 'react';
import ky from 'ky';

import { paths } from '../../../backend/endpoints/paths';

export function Steam(): JSX.Element {
  const [url, setUrl] = useState('');
  useEffect(() => {
    (async () => {
      setUrl(await ky.post(paths.steam.authUrl, { json: {} }).text());
    })();
  }, []);
  return (
    <a href={url} target="_blank" rel="noreferrer">
      Sign in with Steam
    </a>
  );
}
