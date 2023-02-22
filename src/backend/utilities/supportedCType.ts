export const supportedCTypeKeys = [
  'discord',
  'email',
  'github',
  'telegram',
  'twitch',
  'twitter',
  'youtube',
] as const;

export type SupportedCType = (typeof supportedCTypeKeys)[number];
