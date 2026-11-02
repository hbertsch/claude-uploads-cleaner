# Security policy

## Scope

The extension has no permissions and makes no network requests. A security issue is therefore unlikely to be a data leak. The relevant issues are of this kind:

- The extension deletes files you did not ask it to delete, or deletes without the second confirmation.
- It runs on a page other than `https://claude.ai/*`.
- It can be made to run code from a web page, for example through the file names it reads.
- A release package differs from the source in this repository.

Problems with claude.ai itself belong to Anthropic, not to this project.

## Reporting

Please report a vulnerability privately, with [GitHub private vulnerability reporting](https://github.com/hbertsch/claude-uploads-cleaner/security/advisories/new): open the Security tab of the repository and choose "Report a vulnerability". Do not open a public issue for it.

Describe what happens, the steps to reproduce it, the browser and the extension version. Do not send real file names or other personal data.

## What to expect

This is a one-person project. I read reports as soon as I can, tell you whether I can reproduce the problem, and publish a fixed version and a note in [CHANGELOG.md](CHANGELOG.md) when the fix is ready. I give no fixed response times.

## Supported versions

Only the latest release gets fixes.
