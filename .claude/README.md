# EtherDAW Claude Code Setup

This directory contains Claude Code configuration for AI-assisted composition and development.

## Directory Structure

```
.claude/
├── settings.json         # Tool permissions and hooks
├── commands/             # Slash commands
│   ├── compose.md        # /compose - Create compositions
│   ├── verify.md         # /verify - Evidence-based verification
│   ├── plan.md           # /plan - Plan complex tasks
│   ├── onboard.md        # /onboard - Codebase orientation
│   ├── validate.md       # /validate - Single file validation
│   ├── build.md          # /build - Build the project
│   ├── test.md           # /test - Run test suite
│   └── play.md           # /play - Open player in browser
├── skills/               # Auto-loading knowledge
│   ├── etherscore-composition/
│   │   └── SKILL.md      # Note syntax, patterns, instruments
│   ├── verification-patterns/
│   │   └── SKILL.md      # Validation workflow, evidence requirements
│   └── preset-discovery/
│       └── SKILL.md      # 127 synth presets + 20 sample instruments
├── agents/               # Specialized reviewers
│   ├── composition-reviewer.md   # Reviews for musicality and issues
│   └── benchmark-analyzer.md     # Analyzes benchmarks and audio quality
├── rules/                # Validation rules
│   ├── etherscore-validation.md  # Two-layer validation process
│   └── composition-checklist.md  # Pre-export quality checklist
└── hooks/                # Workflow automation
    ├── session-start.sh          # Session feedback
    ├── pre-tool-validate.sh      # Pre-edit validation
    └── post-tool-format.sh       # Post-edit validation
```

## Commands

### Core Workflow

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/compose` | Create new composition | Starting a new track |
| `/verify` | Verify task completion | After completing any task |
| `/plan` | Enter plan mode | Before complex implementations |

### Utility

| Command | Purpose |
|---------|---------|
| `/onboard` | Quick codebase orientation |
| `/validate <file>` | Validate single EtherScore file |
| `/build` | Build TypeScript and browser bundle |
| `/test` | Run test suite |
| `/play` | Open player.html in browser |

## Skills

Skills auto-load based on conversation context:

### etherscore-composition
**Triggers**: compose, notes, pattern, melody, chord, drums

Provides:
- Complete note syntax reference
- All pattern types with examples
- Instrument configuration
- Track options and grooves
- Composition template

### verification-patterns
**Triggers**: /verify, validate, test, verification

Provides:
- Two-layer validation workflow
- Evidence requirements table
- Common error patterns and fixes
- Pre-commit checklist

### preset-discovery
**Triggers**: preset, instrument, synth, sound

Provides:
- All 127+ presets organized by category
- Drum kits and aliases
- Usage examples
- Semantic parameters reference

## Agents

### composition-reviewer

Reviews EtherScore files for:
- Musical quality and coherence
- Technical correctness
- Audio quality concerns (clipping, masking)
- Best practice adherence

**Invoke**: "Review examples/track.etherscore.json for issues"

### benchmark-analyzer

Analyzes benchmark files for:
- Feature coverage completeness
- Audio quality metrics
- Spectrogram comparison
- Validation status

**Invoke**: "Analyze all benchmark files for feature coverage"

## Rules

### etherscore-validation
Applies to: `*.etherscore.json`, `src/validation/**`

Defines:
- Two-layer validation architecture
- When to update schema vs validator
- Common error categories and fixes

### composition-checklist
Applies to: `examples/**/*.etherscore.json`

Defines:
- Pre-export verification steps
- Audio quality requirements
- Naming conventions
- File organization

## Hooks

### PreToolUse (Edit|Write)
Runs before file edits:
- Notes when editing EtherScore files
- Warns when editing on main branch

### PostToolUse (Edit|Write)
Runs after file edits:
- Auto-validates modified EtherScore files
- Notes TypeScript file changes

## Settings

`settings.json` defines:

### Allowed Tools
- Read, Glob, Grep (always allowed)
- Build commands: `npm run build`, `npm run build:browser`
- Test commands: `npm test`, `npm run test:run`
- Git commands: status, diff, log, branch
- CLI commands: validate, compile

### Denied Tools
- `rm -rf *` - Prevent accidental deletion
- `sudo *` - Prevent privilege escalation
- `chmod 777 *` - Prevent permission issues

## Customization

### Adding a Command
1. Create `.claude/commands/command-name.md`
2. Add YAML frontmatter with name and description
3. Document workflow and usage

### Adding a Skill
1. Create `.claude/skills/skill-name/SKILL.md`
2. Add YAML frontmatter with triggers
3. Include comprehensive reference content

### Adding an Agent
1. Create `.claude/agents/agent-name.md`
2. Define purpose, tools, and checklist
3. Include report template

### Adding a Rule
1. Create `.claude/rules/rule-name.md`
2. Define what it applies to
3. Document requirements and workflow

## Typical Workflows

### Creating a New Composition
1. Run `/compose`
2. Provide genre, mood, key elements
3. Claude creates EtherScore file
4. Run `/validate` on the file
5. Open player.html, test playback
6. Run `/verify` to confirm completion

### Verifying Changes
1. Make code or composition changes
2. Run `/verify`
3. Claude runs build, tests, validation
4. Review evidence report
5. Proceed with commit if passing

### Planning Complex Work
1. Run `/plan` for the task
2. Explore codebase in plan mode
3. Design implementation approach
4. Exit plan mode for approval
5. Implement approved plan
