import { Chapter, ChapterDetail, PageResult, Story } from '../types/comic';
import { getJson } from './client';

const PAGE_SIZE = 20;

interface CollectionEnvelope<T> {
  page: T[];
  hasMore: boolean;
  continueCursor: string | null;
}

function parsePage<T>(response: unknown): PageResult<T> {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw new Error('The API returned an unsupported collection response.');
  }

  const envelope = response as CollectionEnvelope<T>;
  if (
    !Array.isArray(envelope.page) ||
    typeof envelope.hasMore !== 'boolean' ||
    (envelope.continueCursor !== null && typeof envelope.continueCursor !== 'string') ||
    (envelope.hasMore && envelope.continueCursor === null)
  ) {
    throw new Error('The API returned an invalid cursor-paginated collection.');
  }

  return {
    items: envelope.page,
    hasMore: envelope.hasMore,
    continueCursor: envelope.continueCursor,
  };
}

async function getCollection<T>(path: string, cursor: string | null): Promise<PageResult<T>> {
  const params = [`limit=${PAGE_SIZE}`];
  if (cursor !== null) params.push(`cursor=${encodeURIComponent(cursor)}`);
  const separator = path.includes('?') ? '&' : '?';
  const response = await getJson<unknown>(`${path}${separator}${params.join('&')}`);
  return parsePage<T>(response);
}

export const getStories = (cursor: string | null) => getCollection<Story>('/stories', cursor);

export const getChapters = (storyId: string, cursor: string | null) =>
  getCollection<Chapter>(`/chapters?story=${encodeURIComponent(storyId)}`, cursor);

export async function getChapter(chapterId: string): Promise<ChapterDetail> {
  const response = await getJson<ChapterDetail>(`/chapters/${encodeURIComponent(chapterId)}`);
  if (!Array.isArray(response.chapterPages)) {
    throw new Error('The chapter response did not include a chapterPages array.');
  }
  return response;
}