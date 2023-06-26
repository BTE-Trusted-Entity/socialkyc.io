export const supportedCTypeKeys = [
  'discord',
  'email',
  'github',
  'telegram',
  'twitch',
  'youtube',
] as const;

export type SupportedCType = (typeof supportedCTypeKeys)[number];
