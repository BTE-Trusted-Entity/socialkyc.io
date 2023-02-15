import { pino } from 'pino';

import { configuration } from './configuration';

export const logger = pino({
  level: 'debug',
  ...(!configuration.isProduction && {
    level: 'trace',
    transport: {
      target: 'pino-pretty',
    },
  }),
});
