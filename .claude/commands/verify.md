# /verify - Verify task completion

Verify that a task has been fully completed with evidence.

## Philosophy

Always verify completion with tangible evidence, not just claims:
- Test output showing passes
- File diffs showing changes
- Working functionality demonstrated
- Browser console showing no errors

## Verification Checklist

### Code Changes
- [ ] TypeScript compiles: `npm run build`
- [ ] All tests pass: `npm run test:run`
- [ ] Browser bundle builds: `npm run build:browser`

### Player Testing
- [ ] Open player.html in browser
- [ ] Composition loads without errors
- [ ] Playback works correctly
- [ ] No console errors

### Documentation
- [ ] CHANGELOG.md updated if version changed
- [ ] README.md updated if features added
- [ ] Code comments for non-obvious logic

### Git
- [ ] Changes staged appropriately
- [ ] Commit message is descriptive
- [ ] No sensitive files included

## Evidence Types

| Type | How to Verify |
|------|---------------|
| Tests pass | Show test output |
| Build works | Show no errors |
| Player works | Take screenshot or describe behavior |
| Feature works | Demonstrate usage |

## Usage

After completing a task, run through relevant checklist items and report evidence of completion.
