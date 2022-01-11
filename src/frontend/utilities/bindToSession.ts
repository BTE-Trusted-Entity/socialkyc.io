interface Callable {
  // This is a case where we really do not care about args and return type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]): any;
}

export type SessionBound<CallbackType extends Callable> = (
  input: Omit<Parameters<CallbackType>[0], 'sessionId'>,
) => ReturnType<CallbackType>;

export function bindToSession<CallbackType extends Callable>(
  sessionId: string,
): (
  callback: CallbackType,
) => (
  input: Omit<Parameters<CallbackType>[0], 'sessionId'>,
) => ReturnType<CallbackType> {
  return (callback: CallbackType) =>
    (input: Omit<Parameters<CallbackType>[0], 'sessionId'>) =>
      callback({ ...input, sessionId });
}
