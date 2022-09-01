import { ServerRoute } from '@hapi/hapi';

import { configuration } from '../utilities/configuration';

import { paths } from './paths';

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
