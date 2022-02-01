import ky, { Options } from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './attestDiscord';

const options: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};

export async function attestDiscord(input: Input): Promise<Output> {
  return ky.post(paths.discord.attest, { json: input, ...options }).json();
}
