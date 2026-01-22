# /compose - Generate a new EtherScore composition

Generate an original EtherScore composition based on user preferences.

## Workflow

1. **Gather Requirements**
   Ask the user for:
   - Genre/mood (e.g., "chill lofi", "energetic synthwave", "ambient cinematic")
   - Approximate duration (e.g., "30 seconds", "1 minute")
   - Key musical elements desired (e.g., "arpeggio lead", "808 drums", "pad chords")
   - Key/tempo preferences (optional)

2. **Create the Composition**
   - Generate valid EtherScore JSON following the format in `docs/ETHERSCORE_FORMAT.md`
   - Use appropriate instrument presets from `src/synthesis/instruments.ts`
   - Include varied patterns, not just loops
   - Add expressive elements (velocity envelopes, articulations)
   - Save to `examples/{descriptive-name}.etherscore.json`

3. **Validate**
   - Ensure JSON is valid
   - Check that all referenced patterns exist
   - Verify instrument presets are valid

4. **Test**
   - Open `player.html` in browser
   - Select the new composition from dropdown
   - Verify it plays correctly

## Example Prompt
"Create a 45-second chill lofi beat with a jazzy piano loop, vinyl crackle vibes, and a boom-bap drum pattern in D minor at 85 BPM"

## Available Instruments
Synths: synth, sine, square, sawtooth
Bass: synth_bass, sub_bass, pluck_bass
Pads: warm_pad, string_pad, ambient_pad
Leads: lead, soft_lead
Keys: electric_piano, organ
Plucks: pluck, bell, marimba
FM: fm_epiano, fm_bass, fm_brass, fm_church_bell, fm_tubular_bell, fm_glass, fm_vibraphone, fm_organ

## Drum Kits
808, 909, acoustic, lofi
