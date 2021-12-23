import ky, { Options } from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmTwitter';

const options: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};

export async function confirmTwitter(input: Input): Promise<Output> {
  return ky.post(paths.twitter.confirm, { json: input, ...options }).json();
}
