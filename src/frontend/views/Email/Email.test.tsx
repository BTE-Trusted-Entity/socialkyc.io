import { describe, it, jest, expect } from '@jest/globals';

import { render } from '../../../testing/testing';
import '../../components/useCopyButton/useCopyButton.mock';

import { EmailTemplate } from './EmailTemplate';

const actions = {
  handleSubmit: jest.fn(),
  handleBackup: jest.fn(),
  handleTryAgainClick: jest.fn(),
  setInputError: jest.fn(),
};

describe('EmailTemplate', () => {
  it('should match snapshot with status=none', async () => {
    const { container } = render(
      <EmailTemplate status="none" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=requested', async () => {
    const { container } = render(
      <EmailTemplate status="requested" processing={true} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=attesting', async () => {
    const { container } = render(
      <EmailTemplate status="attesting" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=ready', async () => {
    const { container } = render(
      <EmailTemplate status="ready" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowError=closed', async () => {
    const { container } = render(
      <EmailTemplate
        status="requested"
        flowError="closed"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowError=unknown', async () => {
    const { container } = render(
      <EmailTemplate
        status="error"
        flowError="unknown"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
