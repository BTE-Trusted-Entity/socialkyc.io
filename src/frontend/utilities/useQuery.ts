import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export function useQuery(): { [key: string]: string } {
  const { search } = useLocation();

  return useMemo(() => {
    const params = new URLSearchParams(search);
    return Object.fromEntries(params.entries());
  }, [search]);
}
