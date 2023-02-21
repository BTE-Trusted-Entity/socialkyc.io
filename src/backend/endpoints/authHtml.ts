import type { ServerRoute } from '@hapi/hapi';

import { z } from 'zod';

import { getHtmlVariant } from '../utilities/htmlVariants';

import { paths } from './paths';

const zodParams = z.object({
  type: z.enum(['discord', 'email', 'github', 'twitch', 'youtube']),
});

export const authHtml: ServerRoute = {
  method: 'GET',
  path: paths.authHtml,
  handler: async () => await getHtmlVariant('index.html'),
  options: { validate: { params: async (params) => zodParams.parse(params) } },
};
