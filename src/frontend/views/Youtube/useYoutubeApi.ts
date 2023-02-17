import { useMemo } from 'react';

import { confirmYoutube } from '../../../backend/youtube/confirmYoutubeApi';
import { authUrlYoutube } from '../../../backend/youtube/authUrlYoutubeApi';
import { quote } from '../../../backend/endpoints/quoteApi';
import { requestAttestationYoutube } from '../../../backend/youtube/requestAttestationYoutubeApi';
import { attest } from '../../../backend/endpoints/attestApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useYoutubeApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrlYoutube),
      confirm: sessionBound(confirmYoutube),
      quote: sessionBound(quote.bind(undefined, 'youtube')),
      requestAttestation: sessionBound(requestAttestationYoutube),
      attest: sessionBound(attest),
    };
  }, [sessionId]);
}
