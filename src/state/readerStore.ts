import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MAX_ZOOM } from '../utils/constants';

export type ReaderLayout = 'vertical' | 'spread';

interface ReaderState {
  zoomScale: number;
  layout: ReaderLayout;
  savedStoryIds: Record<string, true>;
  setZoomScale: (scale: number) => void;
  setLayout: (layout: ReaderLayout) => void;
  toggleSavedStory: (storyId: string) => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      zoomScale: 1,
      layout: 'vertical',
      savedStoryIds: {},
      setZoomScale: (scale) => set({ zoomScale: Math.max(1, Math.min(scale, MAX_ZOOM)) }),
      setLayout: (layout) => set({ layout }),
      toggleSavedStory: (storyId) =>
        set((state) => {
          const savedStoryIds = { ...state.savedStoryIds };
          if (savedStoryIds[storyId]) {
            delete savedStoryIds[storyId];
          } else {
            savedStoryIds[storyId] = true;
          }
          return { savedStoryIds };
        }),
    }),
    {
      name: 'fanon-reader-state-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        zoomScale: state.zoomScale,
        layout: state.layout,
        savedStoryIds: state.savedStoryIds,
      }),
    },
  ),
);
