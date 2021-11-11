import path from 'node:path';

import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { z } from 'zod';

import { configuration } from '../utilities/configuration';
import { getSessionBySecret } from '../utilities/sessionStorage';
import { paths } from './paths';

const zodParams = z.object({
  secret: z.string(),
});

type Params = z.infer<typeof zodParams>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  // Page will not render if some random or incorrect key is entered in the URL
  const { secret } = request.params as Params;
  getSessionBySecret(secret);

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
