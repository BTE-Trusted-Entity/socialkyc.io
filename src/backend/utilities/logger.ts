import pino from 'pino';
import { configuration } from './configuration';

export const logger = pino({
  level: 'info',
  ...(!configuration.isProduction && {
    transport: {
      target: 'pino-pretty',
    },
  }),
});
