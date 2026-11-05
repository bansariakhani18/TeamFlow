import { useState, useCallback } from 'react';

/**
 * Custom hook for making API requests with loading, error, and data state
 */
export const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...args);
        setData(result.data?.data || result.data);
        return { success: true, data: result.data?.data || result.data };
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || 'Something went wrong';
        const errors = err.response?.data?.errors || [];
        setError({ message, errors });
        return { success: false, error: { message, errors } };
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  return { data, loading, error, execute, setData };
};

export default useApi;
