import ky, { Options } from 'ky';
import { useEffect, useState } from 'react';

import { Input, Output } from './attestationEmail';
import { confirmEmail } from './confirmEmailApi';
import { paths } from '../endpoints/paths';

const options: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};

async function attestEmail(input: Input): Promise<Output> {
  return ky.post(paths.email.attest, { json: input, ...options }).json();
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
        await confirmEmail({ secret, sessionId });

        const result = await attestEmail({ sessionId });

        setData(result);
      } catch (error) {
        console.error(error);
        setError(true);
      }
    })();
  }, [secret, sessionId]);

  return { data, error };
}
