import ky, { Options } from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './attestTelegram';

const options: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};

export async function attestTelegram(input: Input): Promise<Output> {
  return ky.post(paths.telegram.attest, { json: input, ...options }).json();
}
