import { useCallback, useDeferredValue, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoryCard } from '../features/home/components/StoryCard';
import { useStories } from '../features/home/hooks/useStories';
import { Story } from '../types/comic';

const genres = ['All stories', 'Fantasy', 'Romance', 'Adventure', 'Mystery'];

export default function HomeScreen() {
  const router = useRouter();
  const { stories, error, isLoading, isRefreshing, isLoadingMore, refresh, loadNextPage } = useStories();
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All stories');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const visibleStories = stories.filter((story) => {
    const matchesSearch = !deferredSearch ||
      `${story.title} ${story.creators.join(' ')}`.toLowerCase().includes(deferredSearch);
    const matchesGenre = selectedGenre === 'All stories' ||
      story.tags.some((tag) => tag.toLowerCase() === selectedGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  const openStory = useCallback((storyId: string) => {
    router.push({ pathname: '/chapter-list', params: { storyId } });
  }, [router]);

  const renderItem = useCallback<ListRenderItem<Story>>(
    ({ item }) => <StoryCard story={item} onOpen={openStory} />,
    [openStory],
  );
  const keyExtractor = useCallback((story: Story) => story.storyId, []);

  const listHeader = (
    <View>
      <View style={styles.topBar}>
        <View style={styles.wordmarkWrap}>
          <View style={styles.wordmarkMark} />
          <Text style={styles.wordmark}>FANON</Text>
        </View>
        <Text style={styles.topBarLabel}>THE COMIC SHELF</Text>
      </View>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>YOUR NEXT OBSESSION</Text>
        <Text style={styles.heading}>Stories worth{ '\n' }staying up for.</Text>
        <Text style={styles.subheading}>Find your next world to get lost in.</Text>
      </View>
      <View style={styles.searchBox}>
        <Text style={styles.searchGlyph}>⌕</Text>
        <TextInput
          accessibilityLabel="Search stories"
          placeholder="Search stories or creators"
          placeholderTextColor="#848C85"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {search.length > 0 ? (
          <Pressable accessibilityLabel="Clear search" onPress={() => setSearch('')} hitSlop={10}>
            <Text style={styles.clearSearch}>×</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={genres}
        horizontal
        keyExtractor={(genre) => genre}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.genreList}
        renderItem={({ item }) => {
          const selected = item === selectedGenre;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSelectedGenre(item)}
              style={[styles.genreChip, selected && styles.genreChipSelected]}
            >
              <Text style={[styles.genreText, selected && styles.genreTextSelected]}>{item}</Text>
            </Pressable>
          );
        }}
      />
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Made for your shelf</Text>
        <Text style={styles.sectionCount}>{visibleStories.length ? `${visibleStories.length} stories` : 'FRESH PICKS'}</Text>
      </View>
      {error && stories.length > 0 ? (
        <Pressable onPress={refresh} style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{error}  ·  Tap to retry</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const emptyComponent = () => (
    <View style={styles.emptyState}>
      {isLoading ? (
        <ActivityIndicator color="#4C702F" />
      ) : (
        <>
          <Text style={styles.emptyTitle}>{error ? 'The shelf is taking a break.' : 'No stories found.'}</Text>
          <Text style={styles.emptyMessage}>
            {error || 'Try another search, or pull down to refresh the collection.'}
          </Text>
          {error ? (
            <Pressable accessibilityRole="button" onPress={refresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );

  const footerComponent = () => {
    if (isLoadingMore) return <ActivityIndicator style={styles.footerLoader} color="#4C702F" />;
    if (error && stories.length > 0) {
      return <Pressable onPress={loadNextPage} style={styles.footerRetry}><Text style={styles.footerRetryText}>Retry loading more</Text></Pressable>;
    }
    return <View style={styles.listEnd} />;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={visibleStories}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={footerComponent}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.55}
        onRefresh={refresh}
        refreshing={isRefreshing}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={40}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8F5' },
  listContent: { flexGrow: 1, paddingBottom: 22 },
  topBar: { height: 54, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmarkWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmarkMark: { width: 12, height: 12, borderRadius: 3, backgroundColor: '#B8E34D', transform: [{ rotate: '-12deg' }] },
  wordmark: { color: '#162019', fontSize: 15, fontWeight: '900', letterSpacing: 0.7 },
  topBarLabel: { color: '#69736A', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  intro: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 20 },
  eyebrow: { color: '#547533', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  heading: { marginTop: 10, color: '#172019', fontSize: 37, lineHeight: 40, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subheading: { marginTop: 9, color: '#69736A', fontSize: 14 },
  searchBox: { height: 48, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderRadius: 4, borderWidth: 1, borderColor: '#E1E6DE', backgroundColor: '#FFFFFF' },
  searchGlyph: { width: 24, color: '#566358', fontSize: 24, lineHeight: 28 },
  searchInput: { flex: 1, height: '100%', color: '#172019', fontSize: 13 },
  clearSearch: { color: '#69736A', fontSize: 22, paddingHorizontal: 3 },
  genreList: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4, gap: 8 },
  genreChip: { paddingHorizontal: 13, height: 31, justifyContent: 'center', borderRadius: 3, backgroundColor: '#E9EDE6' },
  genreChipSelected: { backgroundColor: '#172019' },
  genreText: { color: '#48534A', fontSize: 11, fontWeight: '700' },
  genreTextSelected: { color: '#F6F8F5' },
  sectionHeading: { marginHorizontal: 21, marginTop: 21, marginBottom: 12, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { color: '#172019', fontSize: 20, fontWeight: '800' },
  sectionCount: { color: '#758075', fontSize: 9, fontWeight: '800', letterSpacing: 0.9, textTransform: 'uppercase' },
  inlineError: { marginHorizontal: 20, marginBottom: 12, padding: 10, backgroundColor: '#FFF0ED' },
  inlineErrorText: { color: '#9D4439', fontSize: 12 },
  emptyState: { flex: 1, minHeight: 190, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { color: '#172019', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyMessage: { marginTop: 8, color: '#687269', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryButton: { marginTop: 15, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#172019', borderRadius: 3 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  footerLoader: { paddingVertical: 22 },
  footerRetry: { alignSelf: 'center', marginVertical: 15, padding: 10 },
  footerRetryText: { color: '#547533', fontSize: 12, fontWeight: '800' },
  listEnd: { height: 10 },
});
