import NodeCache from 'node-cache';

let emailCache;

export function initEmailCache() {
  // data is cleared after 5 minutes
  emailCache = new NodeCache({ stdTTL: 60 * 5 });
}

export function saveEmail(key, email, name) {
  const saved = emailCache.set(key, { email, name });
  if (!saved) {
    throw new Error('Error saving email');
  }
}

export function getEmail(key) {
  const data = emailCache.get(key);
  if (!data) {
    throw new Error('Data not found');
  }
  return data;
}
