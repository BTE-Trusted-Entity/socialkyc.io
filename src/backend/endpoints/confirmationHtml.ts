import { ServerRoute } from '@hapi/hapi';

import { configuration } from '../utilities/configuration';
import { paths } from './paths';

export const confirmationHtml: ServerRoute = {
  method: 'GET',
  path: paths.confirmationHtml,
  handler: {
    file: 'index.html',
  },
  options: {
    files: {
      relativeTo: configuration.distFolder,
    },
  },
};
