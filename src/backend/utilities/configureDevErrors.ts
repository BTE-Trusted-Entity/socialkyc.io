import { Server } from '@hapi/hapi';
import devErrors from 'hapi-dev-errors';

import { configuration } from './configuration';

export async function configureDevErrors(server: Server): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const options = { showErrors: !configuration.isProduction };
    await server.register({ plugin: devErrors, options });
  }
}
