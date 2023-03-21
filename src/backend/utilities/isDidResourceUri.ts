import { Did, DidResourceUri } from '@kiltprotocol/sdk-js';

export function isDidResourceUri(input: string): input is DidResourceUri {
  try {
    Did.validateUri(input, 'ResourceUri');
    return true;
  } catch {
    return false;
  }
}
