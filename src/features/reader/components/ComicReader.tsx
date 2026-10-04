import { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { ComicPage } from '../../../types/comic';
import { ReaderLayout } from './ReaderLayout';

export function ComicReader({ pages, isSpread }: { pages: ComicPage[]; isSpread: boolean }) {
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [pageIndex, setPageIndex] = useState(0);
    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setViewport((current) => current.width === width && current.height === height ? current : { width, height });
    }, []);

    return (
        <View style={styles.reader} onLayout={onLayout}>
            {viewport.width > 0 && viewport.height > 0 ? (
                <ReaderLayout
                    key={`${isSpread ? 'spread' : 'vertical'}-${viewport.width}-${viewport.height}`}
                    pages={pages}
                    isSpread={isSpread}
                    width={viewport.width}
                    height={viewport.height}
                    initialPageIndex={Math.min(pageIndex, Math.max(0, pages.length - 1))}
                    onPageChange={setPageIndex}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    reader: { flex: 1, overflow: 'hidden', backgroundColor: '#101411' },
});
