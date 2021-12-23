import ky, { Options } from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './attestationTwitter';

const options: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};

export async function attestTwitter(input: Input): Promise<Output> {
  return ky.post(paths.twitter.attest, { json: input, ...options }).json();
}
