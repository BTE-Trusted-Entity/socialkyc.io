import pino from 'pino';
import { configuration } from './configuration';

export const logger = pino({
  level: 'info',
  ...(!configuration.isProduction && {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
    },
  }),
});
