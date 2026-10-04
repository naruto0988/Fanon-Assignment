import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, ViewToken } from 'react-native';
import { ComicPage } from '../../../types/comic';
import { useComicZoom } from '../hooks/useComicZoom';
import { getSpreadSurfaceHeight, groupPagesIntoSpreads, pageHeight } from '../utils/readerLayout';
import { DoubleSpreadReader } from './DoubleSpreadReader';
import { VerticalScrollReader } from './VerticalScrollReader';

interface ReaderLayoutProps {
    pages: ComicPage[];
    isSpread: boolean;
    width: number;
    height: number;
    initialPageIndex: number;
    onPageChange: (index: number) => void;
}

// ComicReader remounts this boundary when the mode or viewport changes.
// Gesture coordinates are fresh; the page anchor and persisted zoom survive.
export function ReaderLayout({ pages, isSpread, width, height, initialPageIndex, onPageChange }: ReaderLayoutProps) {
    const pageWidth = isSpread ? width / 2 : width;
    const visiblePageIndex = useRef(initialPageIndex);
    const [activePageIndex, setActivePageIndex] = useState(initialPageIndex);
    const spreadPages = useMemo(() => groupPagesIntoSpreads(pages), [pages]);
    // A chapter-wide height avoids resizing the native surface during swipes
    // between short and tall spreads. Pan bounds still use the active spread.
    const spreadSurfaceHeight = useMemo(() => getSpreadSurfaceHeight(pages, width / 2, height), [pages, width, height]);
    const maxRowHeight = useMemo(() => {
        if (!isSpread) return 0;
        const spread = spreadPages[Math.floor(activePageIndex / 2)] ?? [];
        return Math.max(0, ...spread.map(page => pageHeight(page, pageWidth)));
    }, [isSpread, spreadPages, pageWidth, activePageIndex]);

    const zoom = useComicZoom({ isSpread, width, height, maxRowHeight });
    const { spreadList } = zoom;

    const onVerticalViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        const token = viewableItems.find((item) => item.isViewable && item.index !== null);
        if (token?.index !== null && token?.index !== undefined && token.index !== visiblePageIndex.current) {
            visiblePageIndex.current = token.index;
            setActivePageIndex(token.index);
            onPageChange(token.index);
        }
    }, [onPageChange]);

    const onSpreadViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        const token = viewableItems.find((item) => item.isViewable && item.index !== null);
        if (token?.index !== null && token?.index !== undefined && token.index * 2 !== visiblePageIndex.current) {
            visiblePageIndex.current = token.index * 2;
            setActivePageIndex(token.index * 2);
            onPageChange(token.index * 2);
        }
    }, [onPageChange]);

    const goToSpread = (direction: -1 | 1) => {
        const currentSpread = Math.floor(visiblePageIndex.current / 2);
        const nextSpread = Math.max(0, Math.min(currentSpread + direction, spreadPages.length - 1));
        spreadList.current?.scrollToIndex({ index: nextSpread, animated: true });
    };

    if (pages.length === 0) {
        return <Text style={styles.empty}>This chapter has no pages yet.</Text>;
    }

    return (
        <View style={styles.reader}>
            {isSpread ? (
                <DoubleSpreadReader
                    spreads={spreadPages}
                    width={width}
                    surfaceHeight={spreadSurfaceHeight}
                    activePageIndex={activePageIndex}
                    zoom={zoom}
                    onViewableItemsChanged={onSpreadViewableItemsChanged}
                    onNavigate={goToSpread}
                />
            ) : (
                <VerticalScrollReader
                    pages={pages}
                    width={width}
                    activePageIndex={activePageIndex}
                    zoom={zoom}
                    onViewableItemsChanged={onVerticalViewableItemsChanged}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    reader: { flex: 1, overflow: 'hidden', backgroundColor: '#101411' },
    empty: { padding: 28, color: '#FFFFFF', textAlign: 'center' },
});
