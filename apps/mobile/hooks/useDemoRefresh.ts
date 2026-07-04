import { useCallback, useState } from "react";

export function useDemoRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const timer = setTimeout(() => setRefreshing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return { refreshing, onRefresh };
}
