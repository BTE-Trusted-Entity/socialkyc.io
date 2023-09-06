export function filterG<Value>(
  generator: AsyncGenerator<Value>,
  predicate: (value: Value) => Promise<boolean>,
) {
  return (async function* () {
    for await (const value of generator) {
      if (await predicate(value)) {
        yield value;
      }
    }
  })();
}
