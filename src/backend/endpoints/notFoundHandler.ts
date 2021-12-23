import path from 'node:path';

import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi';

import { configuration } from '../utilities/configuration';

export function notFoundHandler(
  request: Request,
  h: ResponseToolkit,
): symbol | ResponseObject {
  const response = request.response;
  if (
    'isBoom' in response &&
    response.isBoom &&
    response.output.statusCode === 404
  ) {
    const { message } = response;
    if (message !== 'Not Found') {
      request.logger.info(message);
    }

    return h.file(path.join(configuration.distFolder, '404.html')).code(404);
  }
  return h.continue;
}
