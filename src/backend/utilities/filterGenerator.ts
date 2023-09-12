import { logger } from './logger';

export function filterGenerator<Value>(
  generator: AsyncGenerator<Value>,
  predicate: (value: Value) => Promise<boolean>,
) {
  return (async function* () {
    for await (const value of generator) {
      if (await predicate(value)) {
        logger.debug(
          `value being yield, from filterG:
          ${typeof value},
          ${JSON.stringify(value)}`,
        );
        yield value;
      }
    }
  })();
}
