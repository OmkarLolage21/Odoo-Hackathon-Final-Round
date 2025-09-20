import { useCallback, useState } from 'react';

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: false });

  const request = useCallback(async (fn: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ data, error: null, loading: false });
      return data;
    } catch (e: any) {
      setState(prev => ({ ...prev, error: e.message || 'Request failed', loading: false }));
      throw e;
    }
  }, []);

  return { ...state, request };
}

export default useApi;
