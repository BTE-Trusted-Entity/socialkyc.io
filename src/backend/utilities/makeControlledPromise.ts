interface ErrorFirstCallback<Output> {
  (error: null, output: Output): void;
  (error: Error): void;
}

export interface ControlledPromise<Result> {
  resolve: (output: Result) => void;
  reject: (error: Error) => void;
  promise: Promise<Result>;
  callback: ErrorFirstCallback<Result>;
}

export function makeControlledPromise<Result>(): ControlledPromise<Result> {
  let resolve: (output: Result) => void = () => null;
  let reject: (error: Error) => void = () => null;

  const promise = new Promise<Result>((resolveArg, rejectArg) => {
    resolve = resolveArg;
    reject = rejectArg;
  });

  return {
    promise,
    resolve,
    reject,

    callback(error, output?) {
      if (error) {
        reject(error);
      } else {
        resolve(output as Result);
      }
    },
  };
}
