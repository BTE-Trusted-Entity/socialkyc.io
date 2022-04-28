import { useMemo } from 'react';

import { confirmYoutube } from '../../../backend/youtube/confirmYoutubeApi';
import { authUrlYoutube } from '../../../backend/youtube/authUrlYoutubeApi';
import { quoteYoutube } from '../../../backend/youtube/quoteYoutubeApi';
import { requestAttestationYoutube } from '../../../backend/youtube/requestAttestationYoutubeApi';
import { attestYoutube } from '../../../backend/youtube/attestYoutubeApi';

import { bindToSession, SessionBound } from '../../utilities/bindToSession';

export function useYoutubeApi(sessionId: string): {
  authUrl: SessionBound<typeof authUrlYoutube>;
  confirm: SessionBound<typeof confirmYoutube>;
  quote: SessionBound<typeof quoteYoutube>;
  requestAttestation: SessionBound<typeof requestAttestationYoutube>;
  attest: SessionBound<typeof attestYoutube>;
} {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrlYoutube),
      confirm: sessionBound(confirmYoutube),
      quote: sessionBound(quoteYoutube),
      requestAttestation: sessionBound(requestAttestationYoutube),
      attest: sessionBound(attestYoutube),
    };
  }, [sessionId]);
}
