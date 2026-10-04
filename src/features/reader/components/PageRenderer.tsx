import { memo, useMemo } from 'react';
import { Image } from 'react-native';
import { ComicPage } from '../../../types/comic';
import { pageHeight } from '../utils/readerLayout';

export const PageRenderer = memo(function PageRenderer({ page, width }: { page: ComicPage; width: number }) {
    const source = useMemo(() => ({ uri: page.pageUrl }), [page.pageUrl]);
    return (
        <Image
            accessible
            accessibilityLabel={page.altText}
            source={source}
            resizeMode="contain"
            fadeDuration={0}
            style={{ width, height: pageHeight(page, width), backgroundColor: '#101411' }}
        />
    );
});
