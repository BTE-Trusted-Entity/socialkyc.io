import { ServerRoute } from '@hapi/hapi';

import { paths } from './paths';
import { configuration } from '../utilities/configuration';

const { maintenanceMode } = configuration;

function handler() {
  return maintenanceMode;
}

export const maintenance: ServerRoute = {
  method: 'GET',
  path: paths.maintenance,
  handler,
  options: { auth: false },
};
