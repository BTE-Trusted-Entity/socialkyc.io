import { ServerRoute } from '@hapi/hapi';

import { configuration } from '../utilities/configuration';

import { paths } from './paths';

const { maintenanceMode } = configuration;

export const maintenance: ServerRoute = {
  method: 'GET',
  path: paths.maintenance,
  handler: () => {
    return maintenanceMode;
  },
  options: { auth: false },
};
