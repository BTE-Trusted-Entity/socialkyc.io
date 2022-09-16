import * as Did from '@kiltprotocol/did';
import { DidResourceUri } from '@kiltprotocol/types';

export function isDidResourceUri(input: string): input is DidResourceUri {
  try {
    Did.validateUri(input, 'ResourceUri');
    return true;
  } catch {
    return false;
  }
}
