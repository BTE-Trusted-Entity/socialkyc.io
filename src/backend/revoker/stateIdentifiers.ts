export function shouldBeRemoved({ createdAt }: { createdAt: Date }) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 2); // remove attestations older than 2 years
  return createdAt < cutoff;
}

export function shouldBeRevoked({ createdAt }: { createdAt: Date }) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1); // revoke attestations older than 1 year
  return createdAt < cutoff;
}
