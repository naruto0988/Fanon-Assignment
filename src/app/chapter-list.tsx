import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, ListRenderItem, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getChapters } from '../api/endpoints';
import { Chapter } from '../types/comic';

export default function ChaptersScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<{ storyId: string; chapters: Chapter[]; error?: string } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const nextCursor = useRef<string | null>(null);
  const hasMore = useRef(true);
  const requestInFlight = useRef(false);
  const loading = result?.storyId !== storyId;
  const chapters = result?.storyId === storyId ? result.chapters : [];
  const error = result?.storyId === storyId ? result.error : null;

  const loadPage = useCallback(async (cursor: string | null, replace: boolean) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (!replace) setLoadingMore(true);

    try {
      const response = await getChapters(storyId, cursor);
      setResult((current) => {
        const currentChapters = !replace && current?.storyId === storyId ? current.chapters : [];
        const existingIds = new Set(currentChapters.map((chapter) => chapter.chapterId));
        const updatedChapters = replace
          ? response.items
          : [...currentChapters, ...response.items.filter((chapter) => !existingIds.has(chapter.chapterId))];
        return { storyId, chapters: updatedChapters };
      });
      nextCursor.current = response.continueCursor;
      hasMore.current = response.hasMore;
    } catch (requestError) {
      setResult((current) => ({
        storyId,
        chapters: !replace && current?.storyId === storyId ? current.chapters : [],
        error: requestError instanceof Error ? requestError.message : 'Unable to load chapters.',
      }));
    } finally {
      requestInFlight.current = false;
      setLoadingMore(false);
    }
  }, [storyId]);

  useEffect(() => {
    let active = true;
    nextCursor.current = null;
    hasMore.current = true;
    void Promise.resolve().then(() => {
      if (active) return loadPage(null, true);
      return undefined;
    });
    return () => { active = false; };
  }, [loadPage, storyId]);

  const openChapter = useCallback((chapterId: string) => {
    router.push({ pathname: '/comic-reader', params: { chapterId } });
  }, [router]);
  const loadNextPage = useCallback(() => {
    if (!loading && hasMore.current && !requestInFlight.current) {
      void loadPage(nextCursor.current, false);
    }
  }, [loadPage, loading]);

  const renderItem = useCallback<ListRenderItem<Chapter>>(({ item, index }) => (
    <Pressable onPress={() => openChapter(item.chapterId)} style={({ pressed }) => [styles.chapter, pressed && styles.pressed]}>
      <View style={styles.chapterNumber}><Text style={styles.numberText}>{String(item.chapterNum ?? index + 1).padStart(2, '0')}</Text></View>
      <View style={styles.chapterCopy}>
        <Text style={styles.chapterTitle}>Chapter {item.chapterNum}</Text>
        <Text numberOfLines={1} style={styles.pageCount}>{item.description}</Text>
        <Text style={styles.pageCount}>{item.pageCount} pages · Type {item.type} · {item.views} views</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  ), [openChapter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.brand}>FANON / CHAPTERS</Text>
      </View>
      <Text style={styles.heading}>Choose a chapter</Text>
      <Text style={styles.subheading}>Pick up where the story begins.</Text>
      {loading ? <ActivityIndicator style={styles.loader} color="#547533" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && chapters.length === 0 ? <Text style={styles.empty}>No chapters are available yet.</Text> : null}
      <FlatList
        data={chapters}
        renderItem={renderItem}
        keyExtractor={(chapter) => chapter.chapterId}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.loader} color="#547533" /> : null}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8F5' },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 19,marginTop:40 },
  backButton: { width: 36, height: 36, justifyContent: 'center' },
  backText: { color: '#172019', fontSize: 34, lineHeight: 36 },
  brand: { marginLeft: 10, color: '#687269', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heading: { paddingHorizontal: 23, paddingTop: 20, color: '#172019', fontSize: 29, fontWeight: '800' },
  subheading: { paddingHorizontal: 23, paddingTop: 7, paddingBottom: 22, color: '#687269', fontSize: 13 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  chapter: { minHeight: 76, marginBottom: 9, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3E7E0', borderRadius: 4 },
  pressed: { opacity: 0.72 },
  chapterNumber: { width: 43, height: 43, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D8EE78', borderRadius: 3 },
  numberText: { color: '#253421', fontSize: 13, fontWeight: '900' },
  chapterCopy: { flex: 1, paddingHorizontal: 13 },
  chapterTitle: { color: '#172019', fontSize: 14, fontWeight: '800' },
  pageCount: { marginTop: 5, color: '#758075', fontSize: 11 },
  chevron: { color: '#748074', fontSize: 25 },
  loader: { marginTop: 30 },
  error: { margin: 22, color: '#A34438', fontSize: 13 },
  empty: { padding: 22, color: '#687269', textAlign: 'center' },
});
