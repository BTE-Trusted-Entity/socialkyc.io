import { parseDidUri } from '@kiltprotocol/did/lib/cjs/Did.utils';
import { DidResourceUri } from '@kiltprotocol/types';

export function isDidResourceUri(input: string): input is DidResourceUri {
  try {
    return Boolean(parseDidUri(input as DidResourceUri).fragment);
  } catch {
    return false;
  }
}
