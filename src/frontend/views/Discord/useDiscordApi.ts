import { useMemo } from 'react';

import { authConfirmDiscord } from '../../../backend/discord/authConfirmDiscordApi';
import { authUrlDiscord } from '../../../backend/discord/authUrlDiscordApi';
import { quoteDiscord } from '../../../backend/discord/quoteDiscordApi';
import { requestAttestationDiscord } from '../../../backend/discord/requestAttestationDiscordApi';
import { attestDiscord } from '../../../backend/discord/attestDiscordApi';

import { bindToSession, SessionBound } from '../../utilities/bindToSession';

export function useDiscordApi(sessionId: string): {
  authUrl: SessionBound<typeof authUrlDiscord>;
  authConfirm: SessionBound<typeof authConfirmDiscord>;
  quote: SessionBound<typeof quoteDiscord>;
  requestAttestation: SessionBound<typeof requestAttestationDiscord>;
  attest: SessionBound<typeof attestDiscord>;
} {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrlDiscord),
      authConfirm: sessionBound(authConfirmDiscord),
      quote: sessionBound(quoteDiscord),
      requestAttestation: sessionBound(requestAttestationDiscord),
      attest: sessionBound(attestDiscord),
    };
  }, [sessionId]);
}
