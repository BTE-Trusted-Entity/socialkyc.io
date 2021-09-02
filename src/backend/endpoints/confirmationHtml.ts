import path from 'node:path';

import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';

import { configuration } from '../utilities/configuration';
import { getRequestForAttestation } from '../utilities/requestCache';

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  // Page will not render if some random or incorrect key is entered in the URL
  const { key } = request.params;
  try {
    getRequestForAttestation(key);
  } catch (error) {
    throw Boom.notFound(`Key not found: ${key}`);
  }

  return h.file(path.join(configuration.distFolder, 'confirmation.html'));
}

export const confirmationHtml: ServerRoute = {
  method: 'GET',
  path: '/confirmation/{key}',
  handler,
};
