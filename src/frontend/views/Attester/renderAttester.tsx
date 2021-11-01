import { render } from 'react-dom';
import { MemoryRouter } from 'react-router-dom';

import { Attester } from './Attester';

function getConfirmation(message: string, callback: (ok: boolean) => void) {
  const allowTransition = window.confirm(message);
  callback(allowTransition);
}

function renderAttester() {
  render(
    <MemoryRouter getUserConfirmation={getConfirmation}>
      <Attester />
    </MemoryRouter>,
    document.querySelector('.left'),
  );
}

renderAttester();
