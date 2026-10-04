import { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItem, Pressable, StyleSheet, Text, ViewToken } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { ComicPage } from '../../../types/comic';
import { readerViewabilityConfig } from '../constants';
import type { ComicZoomController } from '../hooks/useComicZoom';
import { SpreadRow } from './SpreadRow';

const AnimatedSpreadList = Animated.createAnimatedComponent(FlatList<ComicPage[]>);

interface DoubleSpreadReaderProps {
    spreads: ComicPage[][];
    width: number;
    surfaceHeight: number;
    activePageIndex: number;
    zoom: ComicZoomController;
    onViewableItemsChanged: (info: { viewableItems: ViewToken[] }) => void;
    onNavigate: (direction: -1 | 1) => void;
}

export function DoubleSpreadReader({ spreads, width, surfaceHeight, activePageIndex, zoom, onViewableItemsChanged, onNavigate }: DoubleSpreadReaderProps) {
    const { gesture, spreadList, isPinching, onScroll, savedZoom, animatedStyle, scrollRoomStyle } = zoom;
    const footer = useMemo(() => <Animated.View style={scrollRoomStyle} />, [scrollRoomStyle]);
    const renderSpread = useCallback<ListRenderItem<ComicPage[]>>(({ item }) => (
        <SpreadRow pages={item} width={width} pageWidth={width / 2} />
    ), [width]);
    const keyExtractor = useCallback((spread: ComicPage[], index: number) => String(spread[0]?.pageNum ?? index), []);
    const getItemLayout = useCallback((_data: ArrayLike<ComicPage[]> | null | undefined, index: number) => ({
        length: width,
        offset: width * index,
        index,
    }), [width]);

    return (
        <>
            <GestureDetector gesture={gesture}>
                <AnimatedSpreadList
                    ref={spreadList}
                    data={spreads}
                    renderItem={renderSpread}
                    keyExtractor={keyExtractor}
                    horizontal
                    scrollEnabled={!isPinching}
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={Math.floor(activePageIndex / 2)}
                    getItemLayout={getItemLayout}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={readerViewabilityConfig}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    snapToInterval={savedZoom === 1 ? width : undefined}
                    snapToAlignment="start"
                    decelerationRate={savedZoom === 1 ? 'fast' : 'normal'}
                    disableIntervalMomentum
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    windowSize={Math.max(3, Math.ceil(7 / savedZoom))}
                    removeClippedSubviews={false}
                    style={[styles.list, { height: surfaceHeight }, animatedStyle]}
                    contentContainerStyle={styles.content}
                    ListFooterComponent={footer}
                />
            </GestureDetector>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous spread" disabled={activePageIndex < 2} onPress={() => onNavigate(-1)} style={[styles.edgeControl, styles.leftEdge]}>
                <Text style={styles.edgeArrow}>‹</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Next spread" disabled={Math.floor(activePageIndex / 2) >= spreads.length - 1} onPress={() => onNavigate(1)} style={[styles.edgeControl, styles.rightEdge]}>
                <Text style={styles.edgeArrow}>›</Text>
            </Pressable>
        </>
    );
}

const styles = StyleSheet.create({
    // ReaderLayout clips the oversized surface to the visible reading area.
    // Do not shrink the native list back to viewport height with flex: 1.
    list: { flexGrow: 0, flexShrink: 0, width: '100%' },
    content: { flexGrow: 1, alignItems: 'flex-start' },
    edgeControl: { position: 'absolute', top: 0, bottom: 0, width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.16)' },
    leftEdge: { left: 0 },
    rightEdge: { right: 0 },
    edgeArrow: { color: '#FFFFFF', fontSize: 32, fontWeight: '600' },
});
