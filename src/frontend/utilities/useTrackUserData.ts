import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (
      key: string,
      trackingId: string,
      config: { page_path: string },
    ) => void;
  }
}

export const useTrackUserData = () => {
  const trackingId = 'G-WF4S9GHCT9';
  const { listen } = useHistory();

  useEffect(() => {
    const unlisten = listen((location) => {
      if (!window.gtag) return;
      if (!trackingId) {
        console.log('User data tracking is not enabled');
        return;
      }

      console.log(location.pathname);
      window.gtag('config', trackingId, { page_path: location.pathname });
    });

    return unlisten;
  }, [trackingId, listen]);
};
