import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChapter } from '../api/endpoints';
import { ComicReader } from '../features/reader/components/ComicReader';
import { useReaderStore } from '../state/readerStore';
import { ComicPage } from '../types/comic';

export default function ReaderScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const preferredLayout = useReaderStore((state) => state.layout);
  const setLayout = useReaderStore((state) => state.setLayout);
  const isLandscape = width > height;
  const isSpread = isLandscape || preferredLayout === 'spread';
  const [result, setResult] = useState<{ chapterId: string; chapterNum?: number; pages: ComicPage[]; error?: string } | null>(null);
  const loading = result?.chapterId !== chapterId;
  const pages = result?.chapterId === chapterId ? result.pages : [];
  const chapterNum = result?.chapterId === chapterId ? result.chapterNum : undefined;
  const error = result?.chapterId === chapterId ? result.error : null;

  useEffect(() => {
    let active = true;
    getChapter(chapterId)
      .then((chapter) => {
        if (active) setResult({ chapterId, chapterNum: chapter.chapterNum, pages: chapter.chapterPages });
      })
      .catch((requestError: unknown) => {
        if (active) setResult({
          chapterId,
          pages: [],
          error: requestError instanceof Error ? requestError.message : 'Unable to load this chapter.',
        });
      })
    return () => { active = false; };
  }, [chapterId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back to chapters" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.chapterLabel}>
          <Text style={styles.eyebrow}>NOW READING</Text>
          <Text numberOfLines={1} style={styles.title}>{chapterNum ? `CHAPTER ${chapterNum}` : 'COMIC READER'}</Text>
        </View>
        <View style={styles.modeControl} accessibilityRole="tablist" accessibilityLabel="Reader layout">
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Single-page vertical reading"
            accessibilityState={{ selected: !isSpread }}
            disabled={isLandscape}
            onPress={() => setLayout('vertical')}
            style={[styles.modeButton, !isSpread && styles.modeButtonSelected, isLandscape && styles.modeButtonDisabled]}
          >
            <Text style={[styles.modeText, !isSpread && styles.modeTextSelected, isLandscape && styles.modeTextDisabled]}>SINGLE</Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel={isLandscape ? 'Spread layout selected automatically in landscape' : 'Double-page spread'}
            accessibilityState={{ selected: isSpread }}
            disabled={isLandscape}
            onPress={() => setLayout('spread')}
            style={[styles.modeButton, isSpread && styles.modeButtonSelected, isLandscape && styles.modeButtonDisabled]}
          >
            <Text style={[styles.modeText, isSpread && styles.modeTextSelected, isLandscape && styles.modeTextDisabled]}>
              {isLandscape ? 'AUTO' : 'SPREAD'}
            </Text>
          </Pressable>
        </View>
      </View>
      {loading ? <ActivityIndicator style={styles.loader} color="#D8EE78" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error ? <ComicReader pages={pages} isSpread={isSpread} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#101411' },
  toolbar: { minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#101411', borderBottomWidth: 1, borderBottomColor: '#252B26' },
  backButton: { width: 38, height: 42, justifyContent: 'center', alignItems: 'flex-start' },
  backText: { color: '#FFFFFF', fontSize: 32, lineHeight: 36 },
  chapterLabel: { flex: 1, paddingLeft: 7, justifyContent: 'center' },
  eyebrow: { color: '#95A095', fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  title: { marginTop: 3, color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  modeControl: { flexDirection: 'row', padding: 3, borderRadius: 4, backgroundColor: '#202722' },
  modeButton: { minWidth: 59, height: 30, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', borderRadius: 3 },
  modeButtonSelected: { backgroundColor: '#D8EE78' },
  modeButtonDisabled: { opacity: 0.82 },
  modeText: { color: '#BAC2BA', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  modeTextSelected: { color: '#172019' },
  modeTextDisabled: { color: '#D8EE78' },
  loader: { marginTop: 30 },
  error: { padding: 24, color: '#FFFFFF', textAlign: 'center' },
});
