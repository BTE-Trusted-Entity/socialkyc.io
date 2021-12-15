import ky, { Options } from 'ky';

import { Input, Output } from './attestationEmail';
import { paths } from '../endpoints/paths';

const options: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};

export async function attestEmail(input: Input): Promise<Output> {
  return ky.post(paths.email.attest, { json: input, ...options }).json();
}
