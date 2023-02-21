import { useLocation, useRouteMatch } from 'react-router-dom';

import { paths as backendPaths } from '../../backend/endpoints/paths';

export const redirectedPaths = backendPaths.authHtml.replace('{type}', ':type');

interface ValuesFromRedirectUri {
  code?: string | null;
  secret?: string;
  error?: string; // TODO: handle errors
}

export function useValuesFromRedirectUri(
  optionalCode = false,
): ValuesFromRedirectUri {
  const location = useLocation();
  const match = useRouteMatch(redirectedPaths);
  if (!match) {
    return {};
  }

  const searchParams = new URLSearchParams(location.search);
  const secret = searchParams.get('state');
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return { error };
  }

  if (!secret) {
    return { error: 'TODO: A required value "state" is missing' };
  }

  if (!code && !optionalCode) {
    return { error: 'TODO: A required value "code" is missing' };
  }

  return {
    code,
    secret,
  };
}
