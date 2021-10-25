import { render } from 'react-dom';
import { MemoryRouter } from 'react-router-dom';

import { Attester } from './Attester';

function renderAttester() {
  render(
    <MemoryRouter>
      <Attester />
    </MemoryRouter>,
    document.querySelector('.left'),
  );
}

renderAttester();
