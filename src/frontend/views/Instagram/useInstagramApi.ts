import { useMemo } from 'react';

import { quoteTwitch } from '../../../backend/twitch/quoteTwitchApi';
import { requestAttestationTwitch } from '../../../backend/twitch/requestAttestationTwitchApi';
import { attestTwitch } from '../../../backend/twitch/attestTwitchApi';

import { bindToSession } from '../../utilities/bindToSession';
import { authUrlInstagram } from '../../../backend/instagram/authUrlInstagramApi';
import { confirmInstagram } from '../../../backend/instagram/confirmInstagramApi';

export function useInstagramApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrlInstagram),
      confirm: sessionBound(confirmInstagram),
      quote: sessionBound(quoteTwitch),
      requestAttestation: sessionBound(requestAttestationTwitch),
      attest: sessionBound(attestTwitch),
    };
  }, [sessionId]);
}
