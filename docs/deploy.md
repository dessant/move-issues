# Deploying

If you would like to run your own instance of this app, see the
[docs for deployment](https://probot.github.io/docs/deployment/).

This app requires these **Permissions & events** for the GitHub App:

- Issues - **Read & Write**
  - [x] Check the box for **Issue comment** events
- Repository metadata - **Read-only**
- Organization members - **Read-only**
- Single File - **Read-only**
  - Path: `.github/move.yml`

Optional **Permissions & events**:

- Repository contents - **Read-only** (enables autolinking for private
  repositories)
