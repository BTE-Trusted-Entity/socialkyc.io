import got from 'got';

import { Output } from './mockAuthEmail';

export async function mockAuthEmailApi(url: string): Promise<Output> {
  return got.get(url).json();
}
