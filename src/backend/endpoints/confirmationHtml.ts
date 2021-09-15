import path from 'node:path';

import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import { configuration } from '../utilities/configuration';
import { getRequestForAttestation } from '../utilities/requestCache';

const zodParams = z.object({
  key: z.string(),
});

type Params = z.infer<typeof zodParams>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  // Page will not render if some random or incorrect key is entered in the URL
  const { key } = request.params as Params;
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
  options: {
    validate: {
      params: async (params) => zodParams.parse(params),
    },
  },
};
