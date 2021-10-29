import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { didConfigResourcePromise } from '../utilities/didConfigResource';
import { paths } from './paths';

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  return h.response(await didConfigResourcePromise);
}

export const wellKnownDidConfig: ServerRoute = {
  method: 'GET',
  path: paths.wellKnownDidConfiguration,
  handler,
  options: { cors: true, auth: false },
};
