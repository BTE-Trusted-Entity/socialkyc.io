// We do want to override the `render` from testing-library
// eslint-disable-next-line import/export
export * from '@testing-library/react';

import { jest } from '@jest/globals';
import { render as externalRender } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import {
  ControlledPromise,
  makeControlledPromise,
} from '../backend/utilities/makeControlledPromise';

// We do want to override the `render` from testing-library
// eslint-disable-next-line import/export
export function render(
  ui: Parameters<typeof externalRender>[0],
  options?: Parameters<typeof externalRender>[1],
): ReturnType<typeof externalRender> {
  return externalRender(<MemoryRouter>{ui}</MemoryRouter>, options);
}

/** Helps against the warning `Not implemented: HTMLFormElement.prototype.submit`
 * in JSDom: https://github.com/jsdom/jsdom/issues/1937 */
export async function runWithJSDOMErrorsDisabled(
  callback: () => void,
): Promise<void> {
  const console = (
    window as unknown as {
      _virtualConsole: { emit: () => void };
    }
  )._virtualConsole;

  const { emit } = console;
  console.emit = jest.fn();

  await callback();

  console.emit = emit;
}

export interface TestPromise<ReturnType> extends ControlledPromise<ReturnType> {
  jestFn: () => Promise<ReturnType>;
}

export function makeTestPromise<ReturnType>(): TestPromise<ReturnType> {
  const promise = makeControlledPromise<ReturnType>();
  const jestFn = jest
    .fn()
    .mockReturnValue(promise.promise) as () => Promise<ReturnType>;
  return {
    ...promise,
    jestFn,
  };
}
