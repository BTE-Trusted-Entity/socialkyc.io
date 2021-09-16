import { ServerRoute } from '@hapi/hapi';

import { configuration } from '../utilities/configuration';

export const did: ServerRoute = {
  method: 'GET',
  path: '/did',
  handler: () => configuration.did,
};
