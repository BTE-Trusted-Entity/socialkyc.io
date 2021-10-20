function handleBeforeUnload(event: Event): void {
  event.preventDefault();
  event.returnValue = false;
}

export function addUnloadListener(): void {
  window.addEventListener('beforeunload', handleBeforeUnload);
}

export function removeUnloadListener(): void {
  window.removeEventListener('beforeunload', handleBeforeUnload);
}
