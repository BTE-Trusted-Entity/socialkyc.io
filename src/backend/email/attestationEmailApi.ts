import ky from 'ky';
import { useEffect, useState } from 'react';

import { Input, Output } from './attestationEmail';
import { paths } from '../endpoints/paths';

const timeout = 60 * 1000;

async function attestEmail(input: Input): Promise<Output> {
  return ky.post(paths.email.attest, { json: input, timeout }).json();
}

export function useAttestEmail(
  secret: string | undefined,
  sessionId: string,
): {
  data?: Output;
  error?: boolean;
} {
  const [data, setData] = useState<Output | undefined>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!secret) {
      return;
    }
    (async () => {
      try {
        const result = await attestEmail({ secret, sessionId });

        setData(result);
      } catch (error) {
        console.error(error);
        setError(true);
      }
    })();
  }, [secret, sessionId]);

  return { data, error };
}
