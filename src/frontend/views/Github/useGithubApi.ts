import { useMemo } from 'react';

import { confirmGithub } from '../../../backend/github/confirmGithubApi';
import { authUrlGithub } from '../../../backend/github/authUrlGithubApi';
import { quoteGithub } from '../../../backend/github/quoteGithubApi';
import { requestAttestationGithub } from '../../../backend/github/requestAttestationGithubApi';
import { attestGithub } from '../../../backend/github/attestGithubApi';

import { bindToSession, SessionBound } from '../../utilities/bindToSession';

export function useGithubApi(sessionId: string): {
  authUrl: SessionBound<typeof authUrlGithub>;
  confirm: SessionBound<typeof confirmGithub>;
  quote: SessionBound<typeof quoteGithub>;
  requestAttestation: SessionBound<typeof requestAttestationGithub>;
  attest: SessionBound<typeof attestGithub>;
} {
  return useMemo(() => {
    const sessionBound = bindToSession(sessionId);
    return {
      authUrl: sessionBound(authUrlGithub),
      confirm: sessionBound(confirmGithub),
      quote: sessionBound(quoteGithub),
      requestAttestation: sessionBound(requestAttestationGithub),
      attest: sessionBound(attestGithub),
    };
  }, [sessionId]);
}
