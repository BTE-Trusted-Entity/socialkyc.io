import ky, { Options } from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './attestLinkedIn';

const options: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};

export async function attestLinkedIn(input: Input): Promise<Output> {
  return ky.post(paths.twitch.attest, { json: input, ...options }).json();
}
