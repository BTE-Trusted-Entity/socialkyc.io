import { ServerRoute } from '@hapi/hapi';

import { initKilt } from '../utilities/initKilt';

export const liveness: ServerRoute = {
  method: 'GET',
  path: '/liveness',
  options: { auth: false },
  handler: initKilt,
};
