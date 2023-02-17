import { useMemo } from 'react';

import { quote } from '../../../backend/endpoints/quoteApi';
import { sendEmail } from '../../../backend/email/sendEmailApi';
import { confirmEmail } from '../../../backend/email/confirmEmailApi';
import { attest } from '../../../backend/endpoints/attestApi';
import { requestAttestation } from '../../../backend/endpoints/requestAttestationApi';

import { bindToSession } from '../../utilities/bindToSession';

export function useEmailApi(sessionId: string) {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      send: sessionBound(sendEmail),
      confirm: sessionBound(confirmEmail),
      quote: sessionBound(quote.bind(undefined, 'email')),
      requestAttestation: sessionBound(
        requestAttestation.bind(undefined, 'email'),
      ),
      attest: sessionBound(attest),
    };
  }, [sessionId]);
}
