import { Fragment } from 'react';

export function ExpiryDate(): JSX.Element {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return <Fragment>{date.toLocaleDateString()}</Fragment>;
}
