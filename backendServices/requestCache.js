import NodeCache from 'node-cache';

let requestCache;

export function initRequestCache() {
  requestCache = new NodeCache({ stdTTL: 60 * 5 });
}

export function cacheRequest(key, request) {
  const saved = requestCache.set(key, request);
  if (!saved) {
    throw new Error('Error caching data');
  }
}

export function getRequest(key) {
  const data = requestCache.get(key);
  if (!data) {
    throw new Error('Data not found');
  }
  return data;
}
