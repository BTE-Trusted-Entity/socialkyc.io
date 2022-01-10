import { jest } from '@jest/globals';

import { useCopyButton } from './useCopyButton';

jest.mock('./useCopyButton');

jest.mocked(useCopyButton).mockImplementation(() => ({
  supported: true,
  handleCopyClick: jest.fn(),
  className: 'copy',
  title: 'copy to clipboard',
  justCopied: false,
}));
