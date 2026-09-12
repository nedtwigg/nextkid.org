import type { Preview } from '@storybook/react-vite';
import '../src/styles.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    viewport: {
      options: {
        nextKidPhone: {
          name: 'NextKid phone · 390 × 844',
          styles: { width: '390px', height: '844px' },
          type: 'mobile',
        },
      },
    },
    backgrounds: { default: 'touchline', values: [{ name: 'touchline', value: '#19251e' }] },
    a11y: { test: 'error' },
  },
  initialGlobals: { viewport: { value: 'nextKidPhone', isRotated: false } },
};

export default preview;
