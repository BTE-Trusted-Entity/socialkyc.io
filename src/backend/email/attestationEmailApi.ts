import ky, { Options } from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './attestationEmail';

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
