import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { didConfigResourcePromise } from './didConfigResource';
import { paths } from '../endpoints/paths';

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('DID configuration started');
  // The self-signed credential seems to always be the same for every request, can it be generated only once and then cached?
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
