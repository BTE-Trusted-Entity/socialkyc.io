import { useMemo } from 'react';

import { confirmYoutube } from '../../../backend/youtube/confirmYoutubeApi';
import { authUrlYoutube } from '../../../backend/youtube/authUrlYoutubeApi';
import { quoteYoutube } from '../../../backend/youtube/quoteYoutubeApi';
import { requestAttestationYoutube } from '../../../backend/youtube/requestAttestationYoutubeApi';
import { attestYoutube } from '../../../backend/youtube/attestYoutubeApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useYoutubeApi(sessionId: string) {
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
