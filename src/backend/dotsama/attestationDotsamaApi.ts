import ky, { Options } from 'ky';

import { Input, Output } from './attestationDotsama';
import { paths } from '../endpoints/paths';

const options: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};

export async function attestDotsama(input: Input): Promise<Output> {
  return ky.post(paths.dotsama.attest, { json: input, ...options }).json();
}
