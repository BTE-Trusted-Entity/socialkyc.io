import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import { Attester } from './Attester';

function getConfirmation(message: string, callback: (ok: boolean) => void) {
  const allowTransition = window.confirm(message);
  callback(allowTransition);
}

function renderAttester() {
  const container = document.querySelector('.leftContainer');
  if (!container) {
    return;
  }

  const { pathname, search } = window.location;
  const initialEntries = [`${pathname}${search}`];
  window.history.replaceState(null, '', '/');

  const root = createRoot(container);
  root.render(
    <MemoryRouter
      initialEntries={initialEntries}
      getUserConfirmation={getConfirmation}
    >
      <Attester />
    </MemoryRouter>,
  );
}

renderAttester();
