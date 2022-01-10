import { useMemo } from 'react';

import { quoteEmail } from '../../../backend/email/quoteEmailApi';
import { requestAttestationEmail } from '../../../backend/email/sendEmailApi';
import { confirmEmail } from '../../../backend/email/confirmEmailApi';
import { attestEmail } from '../../../backend/email/attestationEmailApi';
import { bindToSession, SessionBound } from '../../utilities/bindToSession';

export function useEmailApi(sessionId: string): {
  quote: SessionBound<typeof quoteEmail>;
  requestAttestation: SessionBound<typeof requestAttestationEmail>;
  confirm: SessionBound<typeof confirmEmail>;
  attest: SessionBound<typeof attestEmail>;
} {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      quote: sessionBound(quoteEmail),
      requestAttestation: sessionBound(requestAttestationEmail),
      confirm: sessionBound(confirmEmail),
      attest: sessionBound(attestEmail),
    };
  }, [sessionId]);
}
