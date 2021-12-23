import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import { paths } from '../endpoints/paths';

import { didConfigResourcePromise } from './didConfigResource';

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('DID configuration started');
  const didConfigResource = await didConfigResourcePromise;

  logger.debug('DID configuration started');
  return h.response(didConfigResource);
}

export const wellKnownDidConfig: ServerRoute = {
  method: 'GET',
  path: paths.wellKnownDidConfiguration,
  handler,
  options: { cors: true, auth: false },
};
