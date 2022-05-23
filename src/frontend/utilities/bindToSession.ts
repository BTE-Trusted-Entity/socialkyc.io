import ky from 'ky';

interface Callable {
  // This is a case where we really do not care about args and return type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]): any;
}

export function bindToSession<CallbackType extends Callable>(
  sessionId: string,
): (
  callback: CallbackType,
) => (input: Parameters<CallbackType>[0]) => ReturnType<CallbackType> {
  const headers = { Authorization: sessionId };
  const boundKy = ky.create({ headers });

  return function bindCallbackToSession(callback: CallbackType) {
    return function boundToSessionCallback(input: Parameters<CallbackType>[0]) {
      return callback(input, boundKy);
    };
  };
}
