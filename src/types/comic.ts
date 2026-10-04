export interface Story {
  storyId: string;
  title: string;
  thumbnailUrl: string;
  views: string;
  creators: string[];
  tags: string[];
  lastUpdated: string;
  chapterCount: number;
}

export interface Chapter {
  chapterId: string;
  chapterNum: number;
  thumbnailUrl: string;
  description: string;
  views: string;
  type: 'A' | 'B';
  pageCount: number;
}

export interface ComicPage {
  pageNum: number;
  pageUrl: string;
  altText: string;
  resolution: [number, number];
}

export interface ChapterDetail {
  chapterNum: number;
  chapterPages: ComicPage[];
  creatorsNotes: { creator: string; note: string }[];
  views: string;
}

export interface PageResult<T> {
  items: T[];
  hasMore: boolean;
  continueCursor: string | null;
}