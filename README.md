# Move Issues

[![Build Status](https://img.shields.io/travis/com/dessant/move-issues/master.svg)](https://travis-ci.com/dessant/move-issues)
[![Version](https://img.shields.io/npm/v/move-issues.svg?colorB=007EC6)](https://www.npmjs.com/package/move-issues)

Move Issues is a GitHub App built with [Probot](https://github.com/probot/probot)
that moves issues between repositories.

<p>
  <img width="420" src="https://raw.githubusercontent.com/dessant/move-issues/master/assets/source-issue.png">
  <img width="420" src="https://raw.githubusercontent.com/dessant/move-issues/master/assets/target-issue.png">
</p>

## Supporting the Project

The continued development of Move Issues is made possible
thanks to the support of awesome backers. If you'd like to join them,
please consider contributing with
[Patreon](https://armin.dev/go/patreon?pr=move-issues&src=repo),
[PayPal](https://armin.dev/go/paypal?pr=move-issues&src=repo) or
[Bitcoin](https://armin.dev/go/bitcoin?pr=move-issues&src=repo).

## Usage

1. **[Install the GitHub App](https://github.com/apps/move)**
   for all source and target repositories
2. Create `.github/move.yml` in the source repository based on the template below
3. Move an issue by creating a comment with this command: `/move to <repo>`

Users must have the following permissions in order to move issues:

* Write access to the source repository
* Write access to the target repository (when the source or target repository
  is private, or when they have different owners)

**If possible, install the app only for select repositories.
Do not leave the `All repositories` option selected, unless you intend
to use the app for all current and future repositories.**

#### Configuration

Create `.github/move.yml` in the default branch to enable the app,
or add it at the same file path to a repository named `.github`.
The file can be empty, or it can override any of these default settings:

```yaml
# Configuration for Move Issues - https://github.com/dessant/move-issues

# Delete the command comment when it contains no other content
deleteCommand: true

# Close the source issue after moving
closeSourceIssue: true

# Lock the source issue after moving
lockSourceIssue: false

# Mention issue and comment authors
mentionAuthors: true

# Preserve mentions in the issue content
keepContentMentions: false

# Move labels that also exist on the target repository
moveLabels: true

# Set custom aliases for targets
# aliases:
#   r: repo
#   or: owner/repo

# Repository to extend settings from
# _extends: repo
```

#### Command Syntax

```
/move [to ][<owner>/]<repo>
```

###### Examples:

```
/move to repo
/move to owner/repo
/move repo
/move owner/repo
```

## Deployment

See [docs/deploy.md](docs/deploy.md) if you would like to run your own
instance of this app.

## License

Copyright (c) 2017-2019 Armin Sebastian

This software is released under the terms of the MIT License.
See the [LICENSE](LICENSE) file for further information.
