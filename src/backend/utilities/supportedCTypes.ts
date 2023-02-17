import type { ICType } from '@kiltprotocol/types';

import { discordCType } from '../discord/discordCType';
import { emailCType } from '../email/emailCType';
import { githubCType } from '../github/githubCType';
import { telegramCType } from '../telegram/telegramCType';
import { twitchCType } from '../twitch/twitchCType';
import { twitterCType } from '../twitter/twitterCType';
import { youtubeCType } from '../youtube/youtubeCType';

export const supportedCTypeKeys = [
  'discord',
  'email',
  'github',
  'telegram',
  'twitch',
  'twitter',
  'youtube',
] as const;

export type SupportedCTypes = (typeof supportedCTypeKeys)[number];

export const supportedCTypes: Record<SupportedCTypes, ICType> = {
  discord: discordCType,
  email: emailCType,
  github: githubCType,
  telegram: telegramCType,
  twitch: twitchCType,
  twitter: twitterCType,
  youtube: youtubeCType,
};
