import type { DidUrl } from '@kiltprotocol/types';

import { validateDid } from '@kiltprotocol/did';

export function isDidUrl(input: string): input is DidUrl {
  try {
    validateDid(input, 'DidUrl');
    return true;
  } catch {
    return false;
  }
}
