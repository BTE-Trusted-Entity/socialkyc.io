import ky from 'ky';

import { sessionHeader } from '../../backend/endpoints/sessionHeader';

interface Callable {
  // This is a case where we really do not care about args and return type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]): any;
}

export function bindToSession(
  sessionId: string,
): <CallbackType extends Callable>(
  callback: CallbackType,
) => (input: Parameters<CallbackType>[0]) => ReturnType<CallbackType> {
  const headers = { [sessionHeader]: sessionId };
  const boundKy = ky.create({ headers });

  return function bindCallbackToSession<CallbackType extends Callable>(
    callback: CallbackType,
  ) {
    return function boundToSessionCallback(input: Parameters<CallbackType>[0]) {
      return callback(input, boundKy);
    };
  };
}
