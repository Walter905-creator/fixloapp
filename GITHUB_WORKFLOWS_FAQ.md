# GitHub Workflows FAQ

This document addresses common questions and clarifications about GitHub Actions workflows in the Fixlo repository.

## Canceled Workflow Runs and Runtime Logs

### Issue Description
You may see error messages like this when a GitHub Copilot coding agent workflow run is canceled:

```
The run was canceled by @copilot-swe-agent[bot].
The operation was canceled.
No files were found with the provided path: /home/runner/work/_temp/runtime-logs/blocked.jsonl
/home/runner/work/_temp/runtime-logs/blocked.md. No artifacts will be uploaded.
```

### Explanation
**This is expected behavior and not an error that needs to be fixed.**

When a Copilot coding agent workflow run is canceled:
1. The GitHub Actions runner stops executing the workflow
2. Cleanup steps attempt to upload runtime logs and artifacts
3. If the run was canceled early, these log files may not exist yet
4. The artifact upload step reports "no files found" - this is informational, not a failure

### What This Means
- ✅ **Normal behavior**: Canceled runs often don't have complete artifacts
- ✅ **No action needed**: The repository code is working correctly
- ✅ **GitHub infrastructure**: These messages come from GitHub's internal workflow system
- ❌ **Not a bug**: No code changes are required to "fix" this

### The Runtime Logs Path
The path `/home/runner/work/_temp/runtime-logs/` is:
- Part of the GitHub Actions runner environment
- Managed by GitHub's infrastructure
- Not controlled by repository code
- Used internally by the Copilot coding agent workflow

## Our Repository Workflows

The fixloapp repository has the following workflows:

### 1. CI Workflow (`.github/workflows/ci.yml`)
- **Purpose**: Continuous Integration - builds and validates code changes
- **Triggers**: Pushes to main/develop branches, pull requests to main
- **Actions**: Install dependencies, build client, verify build artifacts

### 2. EAS Build Workflow (`.github/workflows/eas-build.yml`)
- **Purpose**: Build mobile app using Expo Application Services
- **Triggers**: Manual workflow dispatch
- **Actions**: Build iOS or Android apps for specified profiles

### 3. Copilot Coding Agent Workflow (Dynamic)
- **Purpose**: Automated code assistance and changes via GitHub Copilot
- **Type**: Dynamic workflow managed by GitHub
- **Path**: `dynamic/copilot-swe-agent/copilot`
- **Note**: Not defined in repository code - managed by GitHub infrastructure

## Workflow Best Practices

### When Workflows Are Canceled
- Expect "no artifacts found" messages for runtime logs
- Check the workflow run logs to understand why it was canceled
- Re-run the workflow if needed
- No code changes are needed for these messages

### When Workflows Fail
- Check the job logs for actual errors
- Look for build failures, test failures, or configuration issues
- These ARE actionable and may require code changes

### When Workflows Succeed
- All steps complete successfully
- Artifacts are uploaded (if applicable)
- No error or warning messages

## Getting Help

For workflow-related issues:
1. Check workflow run logs for specific errors
2. Review this FAQ for common scenarios
3. Consult `.github/copilot-instructions.md` for development guidance
4. Check the CI workflow configuration in `.github/workflows/`

---

**Last Updated**: November 2025
**Maintainer**: Fixlo Development Team
