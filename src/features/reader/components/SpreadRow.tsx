import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ComicPage } from '../../../types/comic';
import { MAX_PAGE_HEIGHT } from '../../../utils/constants';
import { pageHeight } from '../utils/readerLayout';
import { PageRenderer } from './PageRenderer';

interface SpreadRowProps {
    pages: ComicPage[];
    width: number;
    pageWidth: number;
}

export const SpreadRow = memo(function SpreadRow({ pages, width, pageWidth }: SpreadRowProps) {
    const rowHeight = Math.min(
        Math.max(...pages.map((page) => pageHeight(page, pageWidth))),
        MAX_PAGE_HEIGHT,
    );

    return (
        <View style={[styles.spreadRow, { width, height: rowHeight }]}>
            {pages.map((page) => (
                <PageRenderer
                    key={page.pageNum}
                    page={page}
                    width={pageWidth}
                />
            ))}
            {pages.length === 1 ? <View style={{ width: pageWidth }} /> : null}
        </View>
    );
});

const styles = StyleSheet.create({
    spreadRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#101411' },
});
