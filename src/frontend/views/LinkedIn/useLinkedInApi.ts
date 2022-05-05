import { useMemo } from 'react';

import { confirmLinkedIn } from '../../../backend/linkedIn/confirmLinkedInApi';
import { authUrlLinkedIn } from '../../../backend/linkedIn/authUrlLinkedInApi';
import { quoteLinkedIn } from '../../../backend/linkedIn/quoteLinkedInApi';
import { requestAttestationLinkedIn } from '../../../backend/linkedIn/requestAttestationLinkedInApi';
import { attestLinkedIn } from '../../../backend/linkedIn/attestLinkedInApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useLinkedInApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrlLinkedIn),
      confirm: sessionBound(confirmLinkedIn),
      quote: sessionBound(quoteLinkedIn),
      requestAttestation: sessionBound(requestAttestationLinkedIn),
      attest: sessionBound(attestLinkedIn),
    };
  }, [sessionId]);
}
