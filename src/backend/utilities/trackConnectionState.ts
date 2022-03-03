export function trackConnectionState(toleratedOffDurationMs: number) {
  let offSince: Date | undefined = new Date();

  return {
    on() {
      offSince = undefined;
    },
    off() {
      offSince = new Date();
    },
    isOffForTooLong() {
      if (!offSince) {
        return false;
      }

      const durationMs = new Date().getTime() - offSince.getTime();
      return durationMs > toleratedOffDurationMs;
    },
  };
}
