import ky, { Options } from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './attestYoutube';

const options: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};

export async function attestYoutube(input: Input): Promise<Output> {
  return ky.post(paths.youtube.attest, { json: input, ...options }).json();
}
