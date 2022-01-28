import { logger } from './logger';
import { manager, server } from './manager';

export function exitOnError(error: Error) {
  logger.fatal(error);

  if (server.info.started !== 0) {
    manager.stop();
  } else {
    process.exit(1);
  }
}
