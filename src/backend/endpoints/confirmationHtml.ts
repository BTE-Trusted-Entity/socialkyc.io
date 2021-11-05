import path from 'node:path';

import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { z } from 'zod';

import { configuration } from '../utilities/configuration';
import { getRequestForAttestation } from '../utilities/requestCache';
import { paths } from './paths';

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
  getRequestForAttestation(key);

  return h.file(path.join(configuration.distFolder, 'index.html'));
}

export const confirmationHtml: ServerRoute = {
  method: 'GET',
  path: paths.confirmationHtml,
  handler,
  options: {
    validate: {
      params: async (params) => zodParams.parse(params),
    },
  },
};
