import { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItem, StyleSheet, ViewToken } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { ComicPage } from '../../../types/comic';
import { readerViewabilityConfig } from '../constants';
import type { ComicZoomController } from '../hooks/useComicZoom';
import { getPageOffsets, pageHeight } from '../utils/readerLayout';
import { PageRenderer } from './PageRenderer';

const AnimatedPageList = Animated.createAnimatedComponent(FlatList<ComicPage>);

interface VerticalScrollReaderProps {
    pages: ComicPage[];
    width: number;
    activePageIndex: number;
    zoom: ComicZoomController;
    onViewableItemsChanged: (info: { viewableItems: ViewToken[] }) => void;
}

export function VerticalScrollReader({ pages, width, activePageIndex, zoom, onViewableItemsChanged }: VerticalScrollReaderProps) {
    const { gesture, verticalList, isPinching, onScroll, savedZoom, animatedStyle, scrollRoomStyle } = zoom;
    const footer = useMemo(() => <Animated.View style={scrollRoomStyle} />, [scrollRoomStyle]);
    const pageOffsets = useMemo(() => getPageOffsets(pages, width), [pages, width]);
    const renderPage = useCallback<ListRenderItem<ComicPage>>(({ item }) => (
        <PageRenderer page={item} width={width} />
    ), [width]);
    const keyExtractor = useCallback((page: ComicPage) => String(page.pageNum), []);
    const getItemLayout = useCallback((_data: ArrayLike<ComicPage> | null | undefined, index: number) => ({
        length: pageHeight(pages[index], width),
        offset: pageOffsets[index],
        index,
    }), [pageOffsets, pages, width]);

    return (
        <GestureDetector gesture={gesture}>
            <AnimatedPageList
                ref={verticalList}
                data={pages}
                scrollEnabled={!isPinching}
                renderItem={renderPage}
                keyExtractor={keyExtractor}
                initialScrollIndex={Math.min(activePageIndex, pages.length - 1)}
                getItemLayout={getItemLayout}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={readerViewabilityConfig}
                onScroll={onScroll}
                scrollEventThrottle={16}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                // The native viewport is magnified too: at 4x, eleven native
                // viewports retain forty-four visible viewports of images.
                windowSize={Math.max(3, Math.ceil(11 / savedZoom))}
                removeClippedSubviews={false}
                showsVerticalScrollIndicator={false}
                style={[styles.list, animatedStyle]}
                contentContainerStyle={styles.content}
                ListFooterComponent={footer}
            />
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    list: { flex: 1, width: '100%' },
    content: { backgroundColor: '#101411' },
});
