import ky from 'ky';
import { useEffect, useState } from 'react';

import { getSession } from '../../frontend/utilities/session';
import { Input, Output } from './attestationEmail';
import { paths } from '../endpoints/paths';

const timeout = 60 * 1000;

async function attestEmail(input: Input): Promise<Output> {
  return ky.post(paths.email.attest, { json: input, timeout }).json();
}

export function useAttestEmail(key: string | undefined): {
  data?: Output;
  error?: boolean;
} {
  const [data, setData] = useState<Output | undefined>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!key) {
      return;
    }
    (async () => {
      try {
        const session = await getSession();
        const did = session.identity;
        const result = await attestEmail({ key, did });

        setData(result);
      } catch (error) {
        console.error(error);
        setError(true);
      }
    })();
  }, [key]);

  return { data, error };
}
