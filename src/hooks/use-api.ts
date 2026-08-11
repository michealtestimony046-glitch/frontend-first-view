/**
 * Custom React hooks for API data fetching
 * Provides loading, error, and data states for components
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Generic hook for fetching data from an API
 */
export const useApi = <T,>(
  fetcher: () => Promise<T>,
  dependencies: unknown[] = []
): UseApiState<T> => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setState({ data: null, loading: true, error: null });
        const result = await fetcher();
        if (isMounted) {
          setState({ data: result, loading: false, error: null });
        }
      } catch (err) {
        if (isMounted) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error('Unknown error'),
          });
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return state;
};

/**
 * Hook for mutations (POST, PUT, DELETE requests)
 */
export interface UseMutationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export const useMutation = <T, V>(
  mutator: (variables: V) => Promise<T>
): [
  (variables: V) => Promise<T>,
  UseMutationState<T>
] => {
  const [state, setState] = useState<UseMutationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables: V) => {
      try {
        setState({ data: null, loading: true, error: null });
        const result = await mutator(variables);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setState({ data: null, loading: false, error });
        throw error;
      }
    },
    [mutator]
  );

  return [mutate, state];
};
