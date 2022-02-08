import ky, { Options } from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './attestGithub';

const options: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};

export async function attestGithub(input: Input): Promise<Output> {
  return ky.post(paths.github.attest, { json: input, ...options }).json();
}
