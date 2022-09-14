import got from 'got';

import { paths } from '../endpoints/paths';
import { configuration } from '../utilities/configuration';

export async function authEmailApi(state: string): Promise<string> {
  return got(`${configuration.baseUri}${paths.redirect.email}`, {
    searchParams: { state },
  }).text();
}
