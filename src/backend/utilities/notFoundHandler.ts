import path from 'node:path';

import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi';
import { configuration } from './configuration';

export function notFoundHandler(
  request: Request,
  h: ResponseToolkit,
): symbol | ResponseObject {
  if (request.response.message === 'Not Found') {
    return h.file(path.join(configuration.distFolder, '404.html')).code(404);
  }
  return h.continue;
}
