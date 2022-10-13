import { useMemo } from 'react';

import { quoteEmail } from '../../../backend/email/quoteEmailApi';
import { sendEmail } from '../../../backend/email/sendEmailApi';
import { confirmEmail } from '../../../backend/email/confirmEmailApi';
import { attestEmail } from '../../../backend/email/attestEmailApi';
import { requestAttestationEmail } from '../../../backend/email/requestAttestationEmailApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useEmailApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      send: sessionBound(sendEmail),
      confirm: sessionBound(confirmEmail),
      quote: sessionBound(quoteEmail),
      requestAttestation: sessionBound(requestAttestationEmail),
      attest: sessionBound(attestEmail),
    };
  }, [sessionId]);
}
