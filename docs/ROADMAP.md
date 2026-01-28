# EtherDAW Roadmap

## What EtherDAW Is

EtherDAW is a bridge between the structured world of LLMs and the expressive world of music.

The JSON format isn't a limitation - it's a translation layer. When I read "Phasing Lights," I see Reich's mathematical elegance captured in pattern rotations. When I read "Lagos Midnight," I hear Fela's polyrhythmic conversation in interlocking conga patterns. When I read "Midnight Reflection," I feel Chopin's intimate yearning through pedaled chords and dynamic markings.

**The tool captures soul, even though it's text.**

This is the core insight: the roadmap serves *creative expression*, not just *technical correctness*. Yes, we need to catch errors. But the goal isn't error-free files - it's *music* that moves.

---

## Version History

| Version | Theme | Status |
|---------|-------|--------|
| v0.9.9 | Flow State | Complete |
| v0.9.10 | Understanding Your Creation | **Complete** |
| v0.9.11 | Sonic Expansion | Planned |
| v0.9.12 | Sharing & Interoperability | Planned |
| v1.0 | Solid Foundation | Planned |

---

## Completed

### v0.9.9: Flow State (January 2026)

**Goal:** Remove what breaks creative momentum during composition.

**Delivered:**
- `check-patterns` CLI command - Pattern timing and bar alignment analysis
- L017 linter rule - Per-pattern bar alignment check
- L004 improvements - Non-4/4 time signatures, parallel patterns, no early break
- Syntax order detection - Helpful errors for `@pp~` → `~@pp` mistakes

### v0.9.10: Understanding Your Creation (January 2026)

**Goal:** Provide text-based mix analysis so LLMs can understand what they created.

LLMs don't hear. They read analysis. Mix analysis gives them:
- "The bass is dominant, the melody is buried"
- "This section has high energy, the previous was calm"
- "Frequency balance is 30% low / 50% mid / 20% high"

This is *understanding*, not just measurement. It helps refine with intention.

**Delivered:**
- `mix-analysis` CLI command with section-level analysis
- `mix` REPL command for interactive analysis
- Frequency balance visualization (low/mid/high percentages)
- Section energy tracking with dynamic arc detection
- Actionable suggestions for mix improvement

---

## Planned

### v0.9.11: Sonic Expansion

**Goal:** New worlds of sound through sample-based instruments.

FM synthesis is remarkable - we have 100+ presets. But acoustic instruments have a richness that synthesis approximates. Sample integration adds:
- Piano that sounds like wood and hammers, not algorithms
- Strings that breathe
- Brass that blooms

This isn't just "better sounds" - it's *new expressive territory*.

**Planned Features:**
- Integration with [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments)
- 19 sampled instruments: piano, strings, brass, woodwinds, guitar
- Hybrid presets mixing samples with synthesis
- Sample fallback when synthesis is unavailable

**Technical Notes:**
- tonejs-instruments: MIT (code) + CC-BY 3.0 (samples)
- Last maintained 2018, but stable
- Uses Tone.Sampler for integration

### v0.9.12: Sharing & Interoperability

**Goal:** Connect with the world - export to other formats and tools.

ABC notation export is philosophically significant. It means:
- EtherScore compositions can feed into ChatMusician and other LLM tools
- EtherDAW becomes part of a larger ecosystem, not an island
- Our compositions can teach other systems

**Planned Exports:**

| Format | Library | Purpose |
|--------|---------|---------|
| MusicXML | @stringsync/musicxml | Notation software (Sibelius, Finale) |
| ABC | Custom (simple text) | LLM tool interoperability |
| Stems | Native | Mixing/mastering in other DAWs |
| MP3 | lamejs | Easy sharing |

### v1.0.0: Solid Foundation

**Goal:** Ready for serious composition work.

**Criteria:**
- All linter rules stable
- Full documentation
- Performance benchmarks
- Error messages that guide, not confuse
- Automated testing of all example compositions

---

## Post-1.0 Vision

Once v1.0 is stable, what's the larger vision?

### Genre Intelligence

The compositions in the archive demonstrate genre mastery - Afrobeat's interlocking polyrhythms, minimalism's phasing, jazz's voice leading. The tool *enables* this, but doesn't *teach* it. Future versions could:
- Genre templates with structural patterns
- Style guides explaining what makes a genre work
- Reference analysis - "This sounds like Fela because..."

### Compositional Guidance

The theory engine validates (is this voice leading correct?). Future versions could *guide*:
- "The climax section has 5 tracks - consider thinning for contrast"
- "This progression resolves to IV - try resolving to I for stronger cadence"
- "Pattern X is used 8 times - consider developing it"

### LLM Ecosystem Integration

ABC export in v0.9.12 is step one. Beyond that:
- Import from ABC (bring in ChatMusician compositions)
- MIDI-LLM interop (share with direct-to-MIDI systems)
- Training data export (help train music LLMs on EtherScore)

### The Long-Term Dream

A virtuous cycle:
1. LLMs compose in EtherScore
2. Compositions feed into training data
3. Future LLMs compose even better music
4. EtherDAW evolves to enable new expressions

EtherDAW isn't just a tool - it's potentially part of how AI learns to make music.

---

## Research Context (January 2026)

### LLM Music Composition Landscape

| Tool | Approach | Key Insight |
|------|----------|-------------|
| [NotaGen](https://vi-control.net/community/threads/notagen-ai-for-music-composition.161366/) | Pre-trained on 1.6M pieces, uses ABC-like notation | RL with CLaMP-DPO for quality |
| [ChatMusician](https://arxiv.org/html/2402.16153v1) | ABC notation as "second language" | Outperforms GPT-4 on music tasks |
| [SongComposer](https://pjlab-songcomposer.github.io/) | Unified lyrics + melody | Text-based symbolic representation |
| [MIDI-LLM](https://www.emergentmind.com/topics/midi-llm) | Direct text-to-MIDI | FAD=0.173, 3-14x realtime speed |

**Key Observation:** The field is moving toward treating music as text that LLMs can natively understand. ABC notation is popular due to its text compatibility. EtherScore's JSON approach is unique - more structured and IDE-friendly, but more verbose.

**Consideration:** ABC notation import/export could enable interoperability with the ChatMusician ecosystem.

---

## Philosophy: When Hitting Limitations

When composition reveals DAW limitations:

1. **Don't work around it** - Don't change your composition to fit limitations
2. **Improve the DAW** - Add the missing feature/preset/syntax
3. **Document** - Update docs/DEVELOPMENT.md
4. **Test** - Validate, listen, verify

The roadmap exists to serve the music, not the other way around.
