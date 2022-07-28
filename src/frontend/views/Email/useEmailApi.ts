import { useMemo } from 'react';

import { quoteEmail } from '../../../backend/email/quoteEmailApi';
import { requestAttestationEmail } from '../../../backend/email/requestAttestationEmailApi';
import { confirmEmail } from '../../../backend/email/confirmEmailApi';
import { attestEmail } from '../../../backend/email/attestationEmailApi';

import { bindToSession } from '../../utilities/bindToSession';

/** 
 * This just provides access to 4 callbacks that construct and send requests to the 4 email related api endpoints.
 * The reasons this exists is that it maintains & uses a ky instance that makes sure that the session id set on the request header.
 */
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
