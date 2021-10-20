export function handleBeforeUnload(event: Event): void {
  event.preventDefault();
  event.returnValue = false;
}
