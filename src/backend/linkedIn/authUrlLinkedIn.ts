import { Request, ServerRoute } from '@hapi/hapi';
import { z } from 'zod';

import { configuration } from '../utilities/configuration';
import {
  getSecretForSession,
  getSession,
  PayloadWithSession,
} from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { linkedInEndpoints } from './linkedInEndpoints';

const zodPayload = z.object({
  sessionId: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('LinkedIn auth started');

  const session = getSession(request.payload as PayloadWithSession);

  const secret = getSecretForSession(session.sessionId);

  const searchParams = {
    response_type: 'code',
    client_id: configuration.linkedIn.clientId,
    state: secret,
    redirect_uri: linkedInEndpoints.redirectUri,
    scope: 'r_liteprofile',
  };
  const url = new URL(linkedInEndpoints.authorize);
  url.search = new URLSearchParams(searchParams).toString();
  logger.debug('Generated LinkedIn auth URL');
  return url.toString() as Output;
}

export const authUrlLinkedIn: ServerRoute = {
  method: 'POST',
  path: paths.linkedIn.authUrl,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
