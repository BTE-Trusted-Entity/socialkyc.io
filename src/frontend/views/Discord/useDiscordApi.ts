import { useMemo } from 'react';

import { confirmDiscord } from '../../../backend/discord/confirmDiscordApi';
import { authUrlDiscord } from '../../../backend/discord/authUrlDiscordApi';
import { quoteDiscord } from '../../../backend/discord/quoteDiscordApi';
import { requestAttestationDiscord } from '../../../backend/discord/requestAttestationDiscordApi';
import { attestDiscord } from '../../../backend/discord/attestDiscordApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useDiscordApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrlDiscord),
      confirm: sessionBound(confirmDiscord),
      quote: sessionBound(quoteDiscord),
      requestAttestation: sessionBound(requestAttestationDiscord),
      attest: sessionBound(attestDiscord),
    };
  }, [sessionId]);
}
