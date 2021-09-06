import { Server } from '@hapi/hapi';

import { configuration } from './configuration';

export async function configureDevErrors(server: Server): Promise<void> {
  try {
    const devErrors = (await import('hapi-dev-errors')).default;
    const options = { showErrors: !configuration.isProduction };
    await server.register({ plugin: devErrors, options });
  } catch {
    // ignore the package missing in production mode
  }
}
