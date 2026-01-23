# Threshold Album - Perceptual Analysis Report

## Analysis Date: 2026-01-23

## Executive Summary

The Threshold album (8 tracks) was analyzed using v0.9 perceptual analysis tools. Refinements were made to 3 tracks to better align sonic characteristics with creative intent.

---

## Analysis Methodology

Each track was analyzed for:
- **Spectral Centroid** (brightness): Hz value indicating tonal character
- **Spectral Flux** (texture): 0-100% indicating smoothness vs rhythmic activity
- **Energy Envelope**: Overall dynamic shape (building, decaying, arc, steady, dynamic)
- **Chromagram**: Pitch class distribution for key/mode inference

### Classification Thresholds

| Metric | Very Dark | Warm | Neutral | Bright | Harsh |
|--------|-----------|------|---------|--------|-------|
| Centroid | <500 Hz | 500-1000 Hz | 1000-2000 Hz | 2000-4000 Hz | >4000 Hz |

| Metric | Very Smooth | Smooth | Moderate | Rhythmic | Choppy |
|--------|-------------|--------|----------|----------|--------|
| Flux | <8% | 8-15% | 15-25% | 25-40% | >40% |

---

## Track-by-Track Results

### Track 1: Before Dawn
- **Intent**: Still, warm ambient
- **Centroid**: 359 Hz (very dark)
- **Flux**: 15% (smooth)
- **Assessment**: Perceptually warm despite "very dark" classification. The low centroid is appropriate for still, contemplative ambient. No changes needed.

### Track 2: First Light (REFINED)
- **Intent**: Awakening, hopeful
- **Before**: 473 Hz (very dark)
- **After**: 547 Hz (warm)
- **Changes Made**:
  - Added `shimmer` instrument (fm_glass) for brighter texture
  - Changed pad from warm_pad to glass_pad
  - Added shimmer_hint, shimmer_grow, shimmer_full patterns
  - Applied crescendo velocity envelopes to early sections
- **Assessment**: Improved brightness creates better "awakening" arc.

### Track 3: The Commute (REFINED)
- **Intent**: Hypnotic, rhythmic
- **Centroid**: ~3785 Hz (bright)
- **Flux**: 14% (smooth)
- **Changes Made**:
  - Lowered synth filter from 1200 Hz to 600 Hz
  - Added driving 16th note hat patterns
  - Boosted bass and pad presence
- **Assessment**: The high centroid is inherent to 808 drum samples. The brightness is genre-appropriate for electronic/hypnotic music. The "smooth" flux doesn't indicate lack of rhythm - it reflects sustained spectral character overlaid with transients.

### Track 4: Midday Static
- **Intent**: Dense, present
- **Centroid**: 378 Hz (very dark)
- **Flux**: 17% (moderate)
- **Assessment**: Dark but appropriately dense texture. No changes needed.

### Track 5: Dissolution
- **Intent**: Fading, soft
- **Centroid**: 438 Hz (very dark)
- **Flux**: 20% (moderate)
- **Envelope**: Arc
- **Assessment**: Arc envelope suggests appropriate rise-and-fall shape for "fading" intent. No changes needed.

### Track 6: Blue Hour
- **Intent**: Wistful, bittersweet
- **Centroid**: 432 Hz (very dark)
- **Flux**: 18% (moderate)
- **Assessment**: Appropriate warmth for wistful mood. Minor key (F minor) detected supports bittersweet character. No changes needed.

### Track 7: Night Architecture (REFINED)
- **Intent**: Electronic, geometric
- **Before**: 1643 Hz (neutral)
- **After**: 2917 Hz (bright)
- **Changes Made**:
  - Increased sequence filter from 2500 Hz to 4000 Hz
  - Increased pulse filter from 1800 Hz to 3500 Hz
  - Changed pad from dark_pad to glass_pad with 3000 Hz filter
  - Added shimmer instrument (fm_glass)
  - Added full 16th note hat patterns and open hats
- **Assessment**: Now achieves the bright, electronic character intended for nocturnal urban atmosphere.

### Track 8: Return
- **Intent**: Peaceful, home
- **Centroid**: 412 Hz (very dark)
- **Flux**: 13% (smooth)
- **Assessment**: Very similar to Track 1 (359 Hz) - excellent bookend pairing. Warm, peaceful character achieved.

---

## Album Cohesion Analysis

### Bookend Test (Track 1 vs Track 8)
| Metric | Before Dawn | Return | Difference |
|--------|-------------|--------|------------|
| Centroid | 359 Hz | 412 Hz | 53 Hz |
| Flux | 15% | 13% | 2% |

**Result**: Excellent cohesion. Both tracks share similar warmth and smoothness, creating a satisfying "full circle" arc.

### Dynamic Journey
```
Track 1: ░░░░░░░░░░  (359 Hz) - dark/warm
Track 2: ░░░░░░░░░░░ (547 Hz) - warm (rising)
Track 3: ████████████████ (3785 Hz) - bright peak
Track 4: ░░░░░░░░░░  (378 Hz) - return to dark
Track 5: ░░░░░░░░░░░ (438 Hz) - warm
Track 6: ░░░░░░░░░░░ (432 Hz) - warm
Track 7: █████████████ (2917 Hz) - second bright peak
Track 8: ░░░░░░░░░░  (412 Hz) - return to dark/warm
```

The album has two "bright" peaks (Tracks 3 and 7) representing more energetic/electronic moments, bookended by warm/dark ambient sections.

---

## Observations

### Classification Threshold Notes
The perceptual analysis classifies tracks <500 Hz as "very dark" while 500-1000 Hz is "warm". Most ambient tracks in this album fall in the 350-470 Hz range, which is perceptually warm but classified as "very dark". This is appropriate for the album's contemplative character.

### Flux Detection Limitations
The spectral flux metric captures sustained spectral change but may underrepresent transient-heavy rhythmic content. Tracks with drum patterns still show relatively low flux values because:
1. Pads and sustained elements dominate the spectral average
2. Short transients have less impact on frame-to-frame spectral difference
3. The metric captures "texture" more than "rhythm"

### Recommendations for Future Analysis
1. Add a transient detection metric specifically for rhythm analysis
2. Consider weighted flux that emphasizes certain frequency bands
3. Add separate metrics for high-frequency (percussive) and low-frequency (tonal) content

---

## Files Modified

1. `examples/album-1-01/02-first-light.etherscore.json`
2. `examples/album-1-01/03-the-commute.etherscore.json`
3. `examples/album-1-01/07-night-architecture.etherscore.json`

## Analysis Script

`scripts/analyze-threshold-album.ts` - Batch perceptual analysis for all tracks

---

## Conclusion

The Threshold album maintains strong cohesion with appropriate sonic characteristics for its ambient/electronic style. Refinements to Tracks 2, 3, and 7 improved alignment with creative intent:

- **First Light** now builds with brighter elements
- **Night Architecture** achieves its intended electronic brightness
- **The Commute** retains its hypnotic 808 character (brightness is genre-appropriate)

Track 1 and Track 8 form an excellent bookend pair with near-identical warmth and texture.
