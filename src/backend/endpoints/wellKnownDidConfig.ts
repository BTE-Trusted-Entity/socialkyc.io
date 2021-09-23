import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { didConfigResourcePromise } from '../utilities/didConfigResource';

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  return h.response(await didConfigResourcePromise);
}

export const wellKnownDidConfig: ServerRoute = {
  method: 'GET',
  path: '/.well-known/did-configuration.json',
  handler,
};
