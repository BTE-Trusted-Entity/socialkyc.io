import { createRoot } from 'react-dom/client';

import { Attester } from './Attester';

function renderAttester() {
  const container = document.querySelector('.leftContainer');
  if (!container) {
    return;
  }

  const root = createRoot(container);
  root.render(<Attester />);
}

renderAttester();
