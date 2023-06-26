import type { ICType } from '@kiltprotocol/sdk-js';

import type { SupportedCType } from './supportedCType';
export type { SupportedCType } from './supportedCType';

import { discordCType } from '../discord/discordCType';
import { emailCType } from '../email/emailCType';
import { githubCType } from '../github/githubCType';
import { telegramCType } from '../telegram/telegramCType';
import { twitchCType } from '../twitch/twitchCType';
import { youtubeCType } from '../youtube/youtubeCType';

export const supportedCTypes: Record<SupportedCType, ICType> = {
  discord: discordCType,
  email: emailCType,
  github: githubCType,
  telegram: telegramCType,
  twitch: twitchCType,
  youtube: youtubeCType,
};
