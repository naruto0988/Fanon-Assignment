import type { ComicPage } from '../../../types/comic';
import { MAX_PAGE_HEIGHT } from '../../../utils/constants';

export function pageHeight(page: ComicPage, width: number) {
    const [imageWidth, imageHeight] = page.resolution;
    return Math.min((width * imageHeight / imageWidth), MAX_PAGE_HEIGHT);
}

export function getCrossAxisBounds(screenSize: number, contentSize: number, scale: number): [number, number] {
    'worklet';
    const scaledContent = contentSize * scale;
    if (scaledContent <= screenSize) {
        const fixed = (screenSize - scaledContent) / 2;
        return [fixed, fixed];
    }
    return [screenSize - scaledContent, 0];
}


export function groupPagesIntoSpreads(pages: ComicPage[]): ComicPage[][] {
    const pairs: ComicPage[][] = [];
    for (let index = 0; index < pages.length; index += 2) pairs.push(pages.slice(index, index + 2));
    return pairs;
}

export function getPageOffsets(pages: ComicPage[], width: number): number[] {
    const offsets: number[] = [];
    let offset = 0;
    for (const page of pages) {
        offsets.push(offset);
        offset += pageHeight(page, width);
    }
    return offsets;
}

export function getSpreadSurfaceHeight(pages: ComicPage[], pageWidth: number, viewportHeight: number): number {
    // The native horizontal list clips to its own frame before transforms.
    // Its frame must contain the full page, not only the reader viewport.
    return pages.reduce((height, page) => Math.max(height, pageHeight(page, pageWidth)), viewportHeight);
}
