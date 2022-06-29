import { Utils } from '@kiltprotocol/did';
import { DidResourceUri } from '@kiltprotocol/types';

export function isDidResourceUri(input: string): input is DidResourceUri {
  try {
    return Boolean(Utils.parseDidUri(input as DidResourceUri).fragment);
  } catch {
    return false;
  }
}
