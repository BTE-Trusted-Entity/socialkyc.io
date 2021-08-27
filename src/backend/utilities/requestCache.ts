import NodeCache from 'node-cache';
import { IRequestForAttestation } from '@kiltprotocol/types';

const requestForAttestationCache = new NodeCache({ stdTTL: 5 * 60 });

export function cacheRequestForAttestation(
  key: string,
  requestForAttestation: IRequestForAttestation,
): void {
  const saved = requestForAttestationCache.set(key, requestForAttestation);
  if (!saved) {
    throw new Error('Error caching data');
  }
}

export function getRequestForAttestation(key: string): IRequestForAttestation {
  const data = requestForAttestationCache.get(key) as IRequestForAttestation;
  if (!data) {
    throw new Error('Data not found');
  }
  return data;
}
