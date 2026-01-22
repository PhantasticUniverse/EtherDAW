---
name: plan
description: Plan complex tasks before implementing
---

# /plan - Enter Plan Mode

Use this command when facing complex, multi-step tasks that benefit from upfront planning.

## When to Use /plan

- **New features** requiring architectural decisions
- **Refactoring** across multiple files
- **Ambiguous requirements** needing clarification
- **Performance optimization** with multiple approaches
- **Integration work** touching several systems

## What Happens

1. Enter **Plan Mode** - code changes disabled
2. **Explore** the codebase to understand context
3. **Design** an implementation approach
4. **Present** the plan for user approval
5. **Exit** plan mode to implement

## Plan Mode Tools

While in plan mode, you can:
- Read files and explore codebase
- Search for patterns and dependencies
- Analyze existing implementations
- Draft implementation plans
- Ask clarifying questions

You cannot:
- Edit or write files
- Run build commands
- Make git commits

## Plan Template

```markdown
## Task Summary
[What we're implementing]

## Current State
[Relevant existing code/patterns]

## Proposed Approach
[Step-by-step implementation plan]

## Files to Modify
- `path/to/file.ts` - [what changes]
- `path/to/other.ts` - [what changes]

## New Files
- `path/to/new.ts` - [purpose]

## Testing Strategy
[How we'll verify it works]

## Open Questions
[Any decisions needing user input]
```

## Exit Plan Mode

Once the plan is ready:
1. Write plan to designated file
2. Use `ExitPlanMode` tool
3. User reviews and approves
4. Implementation begins

## Example Usage

User: "I want to add MIDI import support"

Claude: *Uses /plan to enter plan mode*
- Explores existing MIDI export code
- Researches MIDI file structure
- Identifies parsing requirements
- Proposes implementation plan
- Exits for user approval
