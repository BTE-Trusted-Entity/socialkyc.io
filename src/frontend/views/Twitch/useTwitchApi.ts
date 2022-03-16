import { useMemo } from 'react';

import { confirmTwitch } from '../../../backend/twitch/confirmTwitchApi';
import { authUrlTwitch } from '../../../backend/twitch/authUrlTwitchApi';
import { quoteTwitch } from '../../../backend/twitch/quoteTwitchApi';
import { requestAttestationTwitch } from '../../../backend/twitch/requestAttestationTwitchApi';
import { attestTwitch } from '../../../backend/twitch/attestTwitchApi';

import { bindToSession, SessionBound } from '../../utilities/bindToSession';

export function useTwitchApi(sessionId: string): {
  authUrl: SessionBound<typeof authUrlTwitch>;
  confirm: SessionBound<typeof confirmTwitch>;
  quote: SessionBound<typeof quoteTwitch>;
  requestAttestation: SessionBound<typeof requestAttestationTwitch>;
  attest: SessionBound<typeof attestTwitch>;
} {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrlTwitch),
      confirm: sessionBound(confirmTwitch),
      quote: sessionBound(quoteTwitch),
      requestAttestation: sessionBound(requestAttestationTwitch),
      attest: sessionBound(attestTwitch),
    };
  }, [sessionId]);
}
