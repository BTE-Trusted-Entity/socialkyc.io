import { useMemo } from 'react';

import { quoteEmail } from '../../../backend/email/quoteEmailApi';
import { requestAttestationEmail } from '../../../backend/email/sendEmailApi';
import { confirmEmail } from '../../../backend/email/confirmEmailApi';
import { attestEmail } from '../../../backend/email/attestationEmailApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useEmailApi(sessionId: string) {
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
