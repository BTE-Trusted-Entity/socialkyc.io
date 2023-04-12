import { MemoryRouter } from 'react-router-dom';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

import * as styles from '../src/frontend/css/styles.css';

export const decorators = [
  // You'll receive console outputs as a console,
  // warn and error actions in the panel. You might want to know from
  // what stories they come. In this case, add withConsole decorator:
  (Story) => (
    <MemoryRouter>
      <main className={styles.left}>
        <div className={styles.leftContainer}>
          <Story />
        </div>
      </main>
    </MemoryRouter>
  ),
];

export const parameters = {
  viewport: {
    viewports: {
      ...INITIAL_VIEWPORTS,
      desktop: {
        name: 'Desktop',
        type: 'desktop',
        styles: {
          height: '1000px',
          width: '1600px',
        },
      },
    },
    defaultViewport: 'desktop',
  },
  layout: 'fullscreen',
};
