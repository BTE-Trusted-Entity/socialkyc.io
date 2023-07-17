export function checkTestEnvironment() {
  if (!document.querySelector('[data-test-environment="true"]')) {
    return;
  }

  const message =
    'This is a testing page, do not use it with real KILT coins. Do you want to go to the real SocialKYC?';

  if (!confirm(message)) {
    return;
  }

  window.location.href = 'https://socialkyc.io';
  throw new Error('The user does not want to use the testing page.');
}
