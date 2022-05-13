import ky, { Options } from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './attestInstagram';

const options: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};

export async function attestInstagram(input: Input): Promise<Output> {
  return ky.post(paths.instagram.attest, { json: input, ...options }).json();
}
