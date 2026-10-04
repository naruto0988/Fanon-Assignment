# Reader debug scrolling measurement

Measured on 2026-10-04 on the connected **Samsung SM-M135FU**, Android 14,
1080 × 2408, approximately 60 Hz. App: **Expo Go 57.0.9**, Expo SDK 57,
Metro development bundle (`dev=true`), Chapter 1. The existing Docker-backed
server setup was retained. This is a development-session measurement, not
a standalone debug APK or release build.

The app's temporary zoom diagnostic logged **4** before capture. That diagnostic
was removed afterward. Images were loaded before measurement. Android GPU
profiling bars were disabled for capture and restored to `visual_bars` afterward.

| Mode | Presentation cadence | Worst swipe sample | P95 presentation interval | Intervals >25 ms |
| --- | ---: | ---: | ---: | ---: |
| Single, vertical scroll | 59.75 FPS | 59.05 FPS | 16.75 ms | 2 / 342 |
| Spread, horizontal scroll | 60.10 FPS (approximately 60) | 60.09 FPS | 16.74 ms | 0 / 321 |

## Method and limits

Each mode used two warm-up swipes and six alternating one-second ADB swipes.
SurfaceFlinger `--latency` was cleared immediately before each swipe. The second
timestamp column supplied unique actual-present timestamps for the foreground
Expo Go surface. Zero entries and pending-fence sentinel values were excluded.

ADB's input command has a pre-touch startup delay. Analysis therefore uses the
final one second of presentation timestamps per swipe, instead of including
that idle delay. This window may include the drag's tail; it is an approximate
scrolling-cadence sample, not a touch-delimited Perfetto benchmark. FPS is total
sampled presentation intervals divided by their total elapsed time. P95 and
long-interval counts use those same samples. Minor panel-clock differences
produce the approximately 60.1 FPS spread value.

These are short, warm-image checks on one chapter. They do **not** establish
sustained, jank-free 60 FPS across chapters, cold image loading, tall pages,
long flings, or thermal throttling. No JS FPS was measured. In the wider capture
windows Android gfxinfo still reported frame-deadline misses; the active samples
above should not be read as zero jank throughout the whole interaction.

## Raw evidence

- Single: `2026-10-04T06-39-40-263Z/`, including raw per-swipe latency files,
  `gfxinfo.txt`, `surfaces.txt`, and `corrected-summary.json`.
- Spread: `2026-10-04T06-41-21-075Z/`, including raw per-swipe latency files,
  `samples.json`, `gfxinfo.txt`, and `surfaces.txt`.
- Initial collector run: `2026-10-04T06-37-32-880Z/`. Its derived `samples.json`
  is invalid because it compared CLOCK_MONOTONIC timestamps with suspend-inclusive
  `/proc/uptime`. Its raw evidence is retained but excluded from the results.
- The single run's original `samples.json` includes pre-touch idle time;
  `corrected-summary.json` applies the documented final-one-second window.

Reproduce with the reader at verified 4× zoom:

```sh
node scripts/measure-reader-debug.cjs --confirmed-max-zoom
node scripts/measure-reader-debug.cjs --confirmed-max-zoom --spread
```

The script assumes a 1080-pixel-wide phone and foreground Expo Go. Select the
corresponding reading mode first. Set `FANON_ADB` for another ADB executable.

References: [Android dumpsys](https://developer.android.com/tools/dumpsys),
[SurfaceFlinger](https://source.android.com/docs/core/graphics/surfaceflinger-windowmanager).
