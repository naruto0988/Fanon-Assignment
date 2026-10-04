import { useEffect, useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { cancelAnimation, runOnJS, scrollTo, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withDecay } from 'react-native-reanimated';
import { useReaderStore } from '../../../state/readerStore';
import { ComicPage } from '../../../types/comic';
import { MAX_ZOOM } from '../../../utils/constants';
import { getCrossAxisBounds } from '../utils/readerLayout';

interface UseComicZoomProps {
    isSpread: boolean;
    width: number;
    height: number;
    maxRowHeight: number;
}

export function useComicZoom({ isSpread, width, height, maxRowHeight }: UseComicZoomProps) {
    const savedZoom = useReaderStore((state) => state.zoomScale);
    const setZoomScale = useReaderStore((state) => state.setZoomScale);

    const initialZoom = Math.max(1, Math.min(savedZoom, MAX_ZOOM));
    const scale = useSharedValue(initialZoom);
    const tx = useSharedValue(0);
    const ty = useSharedValue(isSpread ? Math.max(0, (height - maxRowHeight * initialZoom) / 2) : 0);

    const savedScale = useSharedValue(1);
    const savedTx = useSharedValue(0);
    const savedTy = useSharedValue(0);
    const originX = useSharedValue(0);
    const originY = useSharedValue(0);
    const pinchActive = useSharedValue(false);
    const [isPinching, setIsPinching] = useState(false);

    const currentScrollX = useSharedValue(0);
    const currentScrollY = useSharedValue(0);
    const maxScroll = useSharedValue(0);
    const verticalList = useAnimatedRef<FlatList<ComicPage>>();
    const spreadList = useAnimatedRef<FlatList<ComicPage[]>>();
    const onScroll = useAnimatedScrollHandler((event) => {
        currentScrollX.set(event.contentOffset.x);
        currentScrollY.set(event.contentOffset.y);
        maxScroll.set(Math.max(0, isSpread
            ? event.contentSize.width - event.layoutMeasurement.width
            : event.contentSize.height - event.layoutMeasurement.height));
    });

    // Also apply the persisted value when AsyncStorage hydration finishes.
    useEffect(() => {
        if (!pinchActive.value) scale.set(Math.max(1, Math.min(savedZoom, MAX_ZOOM)));
    }, [savedZoom, scale, pinchActive]);

    // Bounds use the same top-left origin as the animated transform.
    useEffect(() => {
        if (isSpread && !pinchActive.value) {
            const bounds = getCrossAxisBounds(height, maxRowHeight, Math.max(1, Math.min(savedZoom, MAX_ZOOM)));
            ty.set((current) => Math.max(bounds[0], Math.min(bounds[1], current)));
        }
    }, [isSpread, height, maxRowHeight, savedZoom, ty, pinchActive]);

    // Keep native gesture attachments stable while page viewability updates React.
    const gesture = useMemo(() => {
        const pinch = Gesture.Pinch()
            .onStart((e) => {
                // The focal point is valid only once the pinch is active.
                cancelAnimation(tx);
                cancelAnimation(ty);
                pinchActive.set(true);
                runOnJS(setIsPinching)(true);
                savedScale.set(scale.value);
                savedTx.set(tx.value);
                savedTy.set(ty.value);
                originX.set(e.focalX);
                originY.set(e.focalY);
            })
            .onUpdate((e) => {
                const nextScale = Math.max(1, Math.min(savedScale.value * e.scale, MAX_ZOOM));
                scale.set(nextScale);

                // Finger-centroid noise must not translate the list at the 1x limit.
                // Otherwise every inward pinch moves it and release snaps it back.
                if (nextScale === 1) {
                    tx.set(0);
                    ty.set(isSpread ? Math.max(0, (height - maxRowHeight) / 2) : 0);
                    return;
                }

                const ratio = nextScale / savedScale.value;
                const rawTx = e.focalX - (originX.value - savedTx.value) * ratio;
                const rawTy = e.focalY - (originY.value - savedTy.value) * ratio;

                if (!isSpread) {
                    ty.set(rawTy);
                    const boundsX = getCrossAxisBounds(width, width, nextScale);
                    tx.set(Math.max(boundsX[0], Math.min(boundsX[1], rawTx)));
                } else {
                    tx.set(rawTx);
                    const boundsY = getCrossAxisBounds(height, maxRowHeight, nextScale);
                    ty.set(Math.max(boundsY[0], Math.min(boundsY[1], rawTy)));
                }
            })
            .onEnd(() => {
                const finalZoom = scale.value;
                if (finalZoom <= 1) {
                    scale.set(1);
                    tx.set(0);
                    ty.set(isSpread ? Math.max(0, (height - maxRowHeight) / 2) : 0);
                    if (savedScale.value !== 1) runOnJS(setZoomScale)(1);
                    return;
                }

                if (isSpread) {
                    const previousScroll = currentScrollX.value;
                    const nextScroll = Math.max(0, Math.min(maxScroll.value, previousScroll - tx.value / finalZoom));
                    // Scroll and compensate the transform in the same UI-thread task.
                    // Keep any residual at the content boundary instead of snapping it away.
                    scrollTo(spreadList, nextScroll, 0, false);
                    tx.set(tx.value + finalZoom * (nextScroll - previousScroll));
                    currentScrollX.set(nextScroll);
                } else {
                    const previousScroll = currentScrollY.value;
                    const nextScroll = Math.max(0, Math.min(maxScroll.value, previousScroll - ty.value / finalZoom));
                    scrollTo(verticalList, 0, nextScroll, false);
                    ty.set(ty.value + finalZoom * (nextScroll - previousScroll));
                    currentScrollY.set(nextScroll);
                }
                runOnJS(setZoomScale)(finalZoom);
            })
            .onFinalize(() => {
                pinchActive.set(false);
                runOnJS(setIsPinching)(false);
            });

        const pan = Gesture.Pan()
            .maxPointers(1)
            .activeOffsetX(isSpread ? 9999 : [-10, 10])
            .activeOffsetY(isSpread ? [-10, 10] : 9999)
            .onBegin(() => {
                if (pinchActive.value) return;
                cancelAnimation(tx);
                cancelAnimation(ty);
                savedTx.set(tx.value);
                savedTy.set(ty.value);
            })
            .onUpdate((e) => {
                if (!pinchActive.value && scale.value > 1) {
                    if (!isSpread) {
                        const boundsX = getCrossAxisBounds(width, width, scale.value);
                        tx.set(Math.max(boundsX[0], Math.min(boundsX[1], savedTx.value + e.translationX)));
                    } else {
                        const boundsY = getCrossAxisBounds(height, maxRowHeight, scale.value);
                        ty.set(Math.max(boundsY[0], Math.min(boundsY[1], savedTy.value + e.translationY)));
                    }
                }
            })
            .onEnd((e) => {
                if (!pinchActive.value && scale.value > 1) {
                    if (!isSpread) {
                        const boundsX = getCrossAxisBounds(width, width, scale.value);
                        tx.set(withDecay({ velocity: e.velocityX, clamp: boundsX }));
                    } else {
                        const boundsY = getCrossAxisBounds(height, maxRowHeight, scale.value);
                        ty.set(withDecay({ velocity: e.velocityY, clamp: boundsY }));
                    }
                }
            });

        const native = Gesture.Native();
        return Gesture.Simultaneous(pinch, pan, native);
    }, [isSpread, width, height, maxRowHeight, scale, tx, ty, savedScale, savedTx, savedTy,
        originX, originY, pinchActive, currentScrollX, currentScrollY, maxScroll,
        verticalList, spreadList, setZoomScale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transformOrigin: 'top left',
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: scale.value }
        ]
    }));
    // Update scroll room while pinching, so persistence on release does not
    // change the content layout a second time.
    const scrollRoomStyle = useAnimatedStyle(() => {
        const zoom = scale.value;
        return isSpread
            ? { width: width * (zoom - 1) / zoom, height: 1 }
            : { width: 1, height: 24 + height * (zoom - 1) / zoom };
    });

    return { gesture, animatedStyle, scrollRoomStyle, onScroll, verticalList, spreadList, savedZoom, isPinching };
}


export type ComicZoomController = ReturnType<typeof useComicZoom>;
