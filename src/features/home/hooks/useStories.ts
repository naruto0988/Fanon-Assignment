import { useCallback, useEffect, useRef, useState } from 'react';
import { getStories } from '../../../api/endpoints';
import { Story } from '../../../types/comic';

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const nextCursor = useRef<string | null>(null);
  const hasMore = useRef(true);
  const requestInFlight = useRef(false);

  const loadPage = useCallback(async (cursor: string | null, replace: boolean) => {
    if (requestInFlight.current) return;

    requestInFlight.current = true;
    setError(null);
    if (replace) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const result = await getStories(cursor);
      setStories((current) => {
        if (replace) return result.items;
        const currentIds = new Set(current.map((story) => story.storyId));
        return [...current, ...result.items.filter((story) => !currentIds.has(story.storyId))];
      });
      nextCursor.current = result.continueCursor;
      hasMore.current = result.hasMore;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load stories.');
    } finally {
      requestInFlight.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadPage(null, true);
      return undefined;
    });
    return () => { active = false; };
  }, [loadPage]);

  const refresh = useCallback(() => {
    nextCursor.current = null;
    hasMore.current = true;
    setIsRefreshing(true);
    void loadPage(null, true);
  }, [loadPage]);

  const loadNextPage = useCallback(() => {
    if (hasMore.current && !requestInFlight.current) void loadPage(nextCursor.current, false);
  }, [loadPage]);

  return { stories, error, isLoading, isRefreshing, isLoadingMore, refresh, loadNextPage };
}