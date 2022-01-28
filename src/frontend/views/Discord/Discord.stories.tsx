import { Meta } from '@storybook/react';

import { DiscordTemplate } from './DiscordTemplate';

export default {
  title: 'Views/Discord',
  component: DiscordTemplate,
} as Meta;

export function Start(): JSX.Element {
  return <DiscordTemplate status="none" processing={false} />;
}
