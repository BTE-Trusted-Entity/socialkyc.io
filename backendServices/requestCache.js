import NodeCache from 'node-cache';

const requestForAttestationCache = new NodeCache({ stdTTL: 5 * 60 });

export function cacheRequestForAttestation(key, requestForAttestation) {
  const saved = requestForAttestationCache.set(key, requestForAttestation);
  if (!saved) {
    throw new Error('Error caching data');
  }
}

export function getRequestForAttestation(key) {
  const data = requestForAttestationCache.get(key);
  if (!data) {
    throw new Error('Data not found');
  }
  return data;
}
