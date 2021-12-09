import { Request, Server } from '@hapi/hapi';
import basicAuth, { ValidateResponse } from '@hapi/basic';

import { configuration } from './configuration';

async function validate(
  request: Request,
  username: string,
  password: string,
): Promise<ValidateResponse> {
  const isValid =
    username === 'test' && password === configuration.httpAuthPassword;

  return {
    isValid,
    credentials: isValid ? {} : null,
  };
}

export async function configureAuthentication(server: Server): Promise<void> {
  if (!configuration.httpAuthPassword) {
    return;
  }

  await server.register(basicAuth);

  server.auth.strategy('simple', 'basic', { validate });
  server.auth.default('simple');
}
