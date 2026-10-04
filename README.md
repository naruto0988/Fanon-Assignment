# Fanon Comic Reader

A React Native comic hosting frontend built with Expo. Browse an infinite story shelf, open a chapter list, and read comics using vertical pages or double-page spreads with shared pinch zoom.

The companion API supplies all story and chapter data. This repository does not implement a backend.

## Run the project

1. Install dependencies with `npm ci`.
2. Start the companion API according to its own repository instructions.
3. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the API address reachable from your device.
4. Run `npm start`, then open the project in Expo Go on Android or iOS.

```dotenv
# Example only: replace this with your computer's actual LAN address.
EXPO_PUBLIC_API_URL=http://192.168.1.24:3001
```

Use `http://10.0.2.2:3001` for the standard Android emulator or `http://localhost:3001` for the iOS simulator. On a physical device, use the API host's LAN address and ensure the device can reach that host. Restart Expo after changing the environment variable. Configure it explicitly rather than relying on the machine-specific Android fallback in `src/api/client.ts`.

```sh
npx expo lint
npx tsc --noEmit
```

On Windows PowerShell, use `npx.cmd` if the execution policy blocks `npx.ps1`.

## Architecture write-up :

The app uses Expo SDK 57, React Native 0.86, React 19, and strict TypeScript. Its entry point is `expo-router/entry`. Routes live in `src/app/`: `index.tsx` displays stories, `chapter-list.tsx` receives a story ID, and `comic-reader.tsx` receives a chapter ID. `_layout.tsx` provides the stack navigator, gesture root, safe-area context, and default status-bar appearance. The root `App.tsx` and `index.ts` are unused starter files.

The API layer uses native `fetch`, a request timeout, and readable error messages. Endpoint functions adapt cursor-paginated collections into typed results. Stories and chapter lists request 20 records at a time, prevent overlapping requests, and remove records already present when appending pages. API response validation checks collection envelopes and the chapter-page array; it does not validate every field.

The home feature owns story cards and the `useStories` hook. Search and genre filters operate on loaded stories. The reader feature separates viewport measurement, layout coordination, vertical and spread lists, image rendering, gesture state, and pure geometry helpers.

`ComicReader` measures the available reading area. `ReaderLayout` tracks the active page and creates one zoom controller shared by either list. A layout or viewport change mounts fresh gesture coordinates while retaining a page anchor. Landscape forces spread mode; returning to portrait restores the saved layout preference.

Page heights come from each image's aspect ratio, supporting both constant-height and varying-height chapters. Precomputed offsets support virtualized scrolling. Consecutive pages form spreads; an odd final page keeps an empty partner slot. Viewport-based visibility detects tall pages without requiring a large fraction of the image to be visible.

Reanimated shared values drive a uniform 1×–4× transform across the list. Pinch-release scroll compensation runs on the UI thread. Zustand persists completed zoom gestures, layout preference, and saved story IDs through AsyncStorage. Page progress and image data are not persisted. Layout heights are capped at 6000 logical units; zoom scales that layout rather than increasing the image's layout dimensions. This cap does not constrain the decoded source bitmap's memory use.

## Folder structure

```text
src/
├── app/                         # Expo Router screens and root layout
├── api/                         # HTTP client and endpoint adapters
├── features/
│   ├── home/
│   │   ├── components/StoryCard.tsx
│   │   └── hooks/useStories.ts
│   └── reader/
│       ├── components/
│       │   ├── ComicReader.tsx
│       │   ├── ReaderLayout.tsx
│       │   ├── VerticalScrollReader.tsx
│       │   ├── DoubleSpreadReader.tsx
│       │   ├── SpreadRow.tsx
│       │   └── PageRenderer.tsx
│       ├── hooks/useComicZoom.ts
│       ├── utils/readerLayout.ts
│       └── constants.ts
├── state/readerStore.ts          # Persisted reader preferences and favorites
├── types/comic.ts                # API/domain interfaces
└── utils/constants.ts           # Shared image-height and zoom limits
```

## Libraries and their purposes

| Library | Purpose in this project |
| --- | --- |
| `expo` | SDK, development tooling, bundling, and platform configuration. |
| `react` / `react-native` | UI components, hooks, images, and virtualized `FlatList` rendering. |
| `expo-router` | File-based navigation and route parameters. |
| `react-native-gesture-handler` | Pinch, pan, and native-scroll gesture composition. |
| `react-native-reanimated` | Shared values, UI-thread transforms, bounded momentum, animated refs, and synchronous scrolling. |
| `react-native-worklets` | Runtime support for Reanimated worklets; application code uses it through Reanimated. |
| `zustand` | Small global store for zoom, layout preference, and saved stories. |
| `@react-native-async-storage/async-storage` | Local storage backing Zustand persistence. |
| `react-native-safe-area-context` | Keeps screens within safe areas such as notches and system bars. |
| `react-native-screens` | Native screen support used by the navigation stack. |
| `expo-status-bar` | Dark status-bar content on browsing screens and light content in the reader. |
| `expo-linking` / `expo-constants` | Installed Expo Router supporting dependencies; not directly imported by application features. |
| `typescript` / `@types/react` | Strict static typing and React type definitions. |
| `eslint` / `eslint-config-expo` | Code and React-hook checks. |

Networking uses the built-in `fetch` API;

## Edge cases

### Handled in the implementation

- Empty story lists, chapter lists, and chapters without pages have empty states.
- First/last spread controls are disabled appropriately; odd and single-page chapters retain an empty partner slot.
- Variable-height pages use individual heights and cumulative offsets.
- Tall pages use viewport coverage for visibility tracking and remain zoomable up to 4×.
- Completed zoom preferences survive chapter navigation and are stored for app restarts.
- Pinching below 1× holds a stable baseline; zoom is capped at 4×.
- Pan is bounded on the cross axis and does not update during an active pinch.
- Mode changes and rotation reset transient gesture coordinates while preserving the page anchor.
- API connection failures, request timeouts, non-success responses, and invalid collection envelopes produce readable errors.
- Pagination guards overlapping requests and filters IDs already loaded from previous pages.
- Stories support pull-to-refresh and retry actions.
- Reader requests ignore results after their screen effect is cleaned up.

These are code paths, not a claim that every case has passed physical-device testing.

### Not handled or still limited

- Failed image downloads have no per-page retry UI or explicit error placeholder.
- Invalid/zero image dimensions, malformed item fields, duplicate IDs within one response, and out-of-order page arrays are not comprehensively validated.
- Offline chapter downloads, a managed image cache, and server-data caching are not implemented.
- Exact pixel position and reading progress are not restored after leaving a chapter or restarting. Switching from an odd-numbered page to a spread anchors its pair.
- An immediate process kill before the asynchronous storage write finishes can lose the latest zoom update. An unfinished/cancelled pinch is not guaranteed to persist its current scale.
- Search only covers stories already fetched; there is no server-side search.
- Refreshing stories while a pagination request is in flight can reset the cursor without starting a replacement request.
- Chapter and reader fetch failures lack dedicated retry buttons; the chapter request lifecycle also needs stronger stale-response protection.
- Transformed-list visibility, rapid repeated rotation, interrupted pinches, and very large decoded bitmaps need additional device stress testing.
- The 6000-unit layout cap is not source-image validation or image tiling; extreme aspect ratios can introduce letterboxing.
- RTL/manga reading order and platform-wide accessibility verification are not implemented.

## Scroll FPS at maximum zoom

Measured at **4× zoom** on your Samsung SM-M135FU, Android 14, using the Expo Go debug session with your Docker setup:

- **Single-page scrolling:** 59.75 FPS
- **Spread scrolling:** approximately 60 FPS

These are short, warm-image presentation-cadence samples on an approximately 60 Hz display. See [raw evidence, method, and limitations](/REPORT.md). These samples do not establish sustained 60 FPS.




## Three engineering decisions

| A chosen over B | Why I chose A | What would make me switch to B |
| --- | --- | --- |
| Reanimated UI-thread transforms over resizing every page through React state during a pinch | Scale and pan can update without rerendering every page or recalculating image layout on each gesture update. | Persistent clipping or incorrect visible-page tracking at high zoom would justify zoom-aware layout dimensions, committed when the pinch finishes. |
| Virtualized `FlatList` with precomputed offsets over a `ScrollView` containing all pages | Mounting a limited window of images reduces work for long chapters, and known offsets support page navigation. | If chapters were guaranteed to contain only a few small pages and virtualization caused unnecessary complexity, I would use a `ScrollView`. |
| Persisting completed zoom gestures over writing every pinch update to AsyncStorage | Finger movement stays in shared values, avoiding repeated JS calls and storage writes. | A requirement to recover an interrupted pinch after a crash would justify throttled checkpoints and app-background handling. |

## The part of the codebase I am least happy with

`src/features/reader/hooks/useComicZoom.ts` handles pinch origins, transforms, native scroll offsets, pan bounds, momentum, and persistence for both reader modes. Scaling the whole native list makes viewability and clipping harder to reason about because native layout dimensions differ from the visible zoomed viewport. I would separate geometry and gesture transitions into smaller units and add targeted tests for interrupted pinches, content boundaries, and mode changes before extending it.

## One thing I tried that did not work

The first FPS collector compared SurfaceFlinger presentation timestamps with `/proc/uptime` and incorrectly found zero matching frames. They use different clock bases: presentation timestamps are monotonic, while uptime includes time spent suspended. I corrected the calculation to use presentation timestamps directly, then excluded ADB's pre-touch startup delay from the reported scrolling samples.

## AI assistance

**AI assistance used: GitHub Copilot.** It helped with code review, reader implementation, refactoring. Changes were checked against observed app behavior, lint, and TypeScript; static checks do not replace device testing.

### A suggestion I rejected

The agent initially recommended measuring FPS in a release build. I chose the existing Expo Go debug session with the Docker-backed server because that was the environment I wanted evaluated. The reported results are labeled as development measurements; sustained release-build profiling remains a separate verification task.

## Verification and submission status

- Lint and TypeScript checks passed during implementation.
- Android export/bundling passed after the reader refactor.
- Ad hoc checks exercised variable-height offsets, odd/empty spread grouping, pan bounds, minimum zoom stability, and pinch-release position preservation. These are not a committed automated test suite.
- Short physical-device development FPS samples are recorded in `/REPORT.md`; sustained release-build measurements and complete Android/iOS acceptance testing remain outstanding.
