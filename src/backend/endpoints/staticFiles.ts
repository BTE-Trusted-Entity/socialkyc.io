import { configuration } from '../utilities/configuration';

export const staticFiles = {
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: configuration.distFolder,
    },
  },
  options: {
    tags: ['noLogs'],
  },
};
