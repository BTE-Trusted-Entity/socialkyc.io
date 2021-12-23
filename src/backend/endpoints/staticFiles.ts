import { configuration } from '../utilities/configuration';

import { paths } from './paths';

export const staticFiles = {
  method: 'GET',
  path: paths.staticFiles,
  handler: {
    directory: {
      path: configuration.distFolder,
    },
  },
  options: {
    tags: ['noLogs'],
  },
};
