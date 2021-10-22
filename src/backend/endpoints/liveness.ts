import { ServerRoute } from '@hapi/hapi';

import { initKilt } from '../utilities/initKilt';
import { paths } from './paths';

export const liveness: ServerRoute = {
  method: 'GET',
  path: paths.liveness,
  options: { auth: false },
  handler: initKilt,
};
