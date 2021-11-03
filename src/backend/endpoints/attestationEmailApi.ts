import ky from 'ky';
import { useEffect, useState } from 'react';

import { getSession } from '../../frontend/utilities/session';
import { Input, Output } from './attestationEmail';
import { paths } from './paths';

const timeout = 60 * 1000;

export async function attestEmail(input: Input): Promise<Output> {
  return ky.post(paths.attestEmail, { json: input, timeout }).json();
}

export function useAttestEmail(key: string | undefined): {
  data?: Output;
  error?: unknown;
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
