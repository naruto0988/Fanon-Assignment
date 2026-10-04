import { memo, useCallback } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Story } from '../../../types/comic';
import { useReaderStore } from '../../../state/readerStore';

interface StoryCardProps {
  story: Story;
  onOpen: (storyId: string) => void;
}

const coverColors = ['#D8EE78', '#F0A994', '#93CFC4', '#E8C76C', '#A8B9E6'];

function StoryCardComponent({ story, onOpen }: StoryCardProps) {
  const isSaved = useReaderStore((state) => state.savedStoryIds[story.storyId] === true);
  const toggleSavedStory = useReaderStore((state) => state.toggleSavedStory);
  const handleOpen = useCallback(() => onOpen(story.storyId), [onOpen, story.storyId]);
  const handleSave = useCallback(() => toggleSavedStory(story.storyId), [story.storyId, toggleSavedStory]);
  const coverColor = coverColors[story.storyId.charCodeAt(0) % coverColors.length];

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${story.title}`}
        onPress={handleOpen}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={[styles.cover, { backgroundColor: coverColor }]}>
          {story.thumbnailUrl ? (
            <Image source={{ uri: story.thumbnailUrl }} resizeMode="cover" style={styles.coverImage} />
          ) : (
            <>
              <Text style={styles.coverKicker}>FANON COMICS</Text>
              <Text numberOfLines={4} style={styles.coverTitle}>{story.title}</Text>
              <View style={styles.coverMark} />
            </>
          )}
        </View>
        <View style={styles.details}>
          <Text numberOfLines={2} style={styles.title}>{story.title}</Text>
          <Text numberOfLines={1} style={styles.author}>{story.creators.join(', ')}</Text>
          <View style={styles.metaRow}>
            <Text numberOfLines={1} style={styles.genre}>{story.tags[0] || 'COMIC'}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.chapterCount}>
              {`${story.chapterCount} chapters · ${story.views} views`}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isSaved ? `Remove ${story.title} from saved stories` : `Save ${story.title}`}
        accessibilityState={{ selected: isSaved }}
        onPress={handleSave}
        hitSlop={8}
        style={styles.saveButton}
      >
        <Text style={[styles.saveIcon, isSaved && styles.saveIconActive]}>{isSaved ? '♥' : '♡'}</Text>
      </Pressable>
    </View>
  );
}

export const StoryCard = memo(StoryCardComponent);

const styles = StyleSheet.create({
  card: {
    minHeight: 152,
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E8E1',
  },
  main: { flexDirection: 'row', gap: 14 },
  pressed: { opacity: 0.76 },
  cover: {
    width: 92,
    height: 128,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 8,
  },
  coverImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  coverKicker: { color: '#172019', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  coverTitle: { color: '#172019', fontSize: 15, fontWeight: '900', lineHeight: 16 },
  coverMark: {
    position: 'absolute',
    width: 44,
    height: 44,
    right: -18,
    top: 34,
    borderRadius: 22,
    borderWidth: 7,
    borderColor: 'rgba(255,255,255,0.48)',
  },
  details: { flex: 1, paddingTop: 3, paddingRight: 24 },
  title: { color: '#172019', fontSize: 17, fontWeight: '800', lineHeight: 21 },
  author: { marginTop: 5, color: '#69716A', fontSize: 12, fontWeight: '600' },
  description: { marginTop: 8, color: '#58615A', fontSize: 12, lineHeight: 17 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto', paddingTop: 8 },
  genre: { color: '#355A37', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  metaDot: { paddingHorizontal: 6, color: '#A2AAA1' },
  chapterCount: { flex: 1, color: '#7C847D', fontSize: 10, fontWeight: '600' },
  saveButton: { position: 'absolute', right: 13, top: 12, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  saveIcon: { color: '#69716A', fontSize: 22, lineHeight: 24 },
  saveIconActive: { color: '#D94C3D' },
});