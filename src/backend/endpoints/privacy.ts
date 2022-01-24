import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi';

import { configuration } from '../utilities/configuration';
import { replaceHexagon } from '../utilities/replaceHexagon';

import { paths } from './paths';

const html = 'privacy.html';

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;

  await replaceHexagon(html);

  logger.debug(`${html} overwritten with new random hexagon`);

  return h.file(html);
}

export const privacy = {
  method: 'GET',
  path: paths.privacy,
  handler,
  options: {
    files: {
      relativeTo: configuration.distFolder,
    },
  },
};
