const moment = require('moment');
const toMarkdown = require('to-markdown');

const defaults = require('./defaults');

module.exports = class Move {
  constructor(robot, context, config, command) {
    this.arguments = command.arguments || '';
    this.context = context;
    this.config = Object.assign({}, defaults, config);
    this.logger = robot.log;
    this.robot = robot;
  }

  log(message, type = 'info') {
    if (!this.config.perform) {
      message += ' (dry run)';
    }
    this.logger[type](message);
  }

  get issueOpen() {
    return this.context.payload.issue.state === 'open';
  }

  get issueLocked() {
    return this.context.payload.issue.locked;
  }

  getMarkdown(html) {
    const highlightRx = /highlight highlight-(\S+)/;
    return toMarkdown(html, {
      gfm: true,
      converters: [
        {
          filter: function(node) {
            return (
              node.nodeName === 'PRE' &&
              node.parentNode.nodeName === 'DIV' &&
              highlightRx.test(node.parentNode.className)
            );
          },
          replacement: function(content, node) {
            const language = node.parentNode.className.match(highlightRx)[1];
            return (
              `\n\n\`\`\`${language.replace('source-', '')}\n` +
              `${node.textContent}\n\`\`\`\n\n`
            );
          }
        }
      ]
    });
  }

  async command() {
    const {isBot, payload, github: sourceGh} = this.context;
    const {
      perform,
      closeSourceIssue,
      lockSourceIssue,
      deleteCommand,
      aliases
    } = this.config;

    if (isBot || payload.issue.hasOwnProperty('pull_request')) {
      return;
    }

    const source = this.context.issue();
    const sourceUrl = `${source.owner}/${source.repo}/issues/${source.number}`;
    const cmdUser = payload.comment.user.login;
    const cmdCommentId = payload.comment.id;
    const isCmdCommentContent = payload.comment.body.trim().includes('\n');

    const sourcePermission = (await sourceGh.repos.reviewUserPermissionLevel({
      owner: source.owner,
      repo: source.repo,
      username: cmdUser
    })).data.permission;
    if (!['write', 'admin'].includes(sourcePermission)) {
      return;
    }

    let args = this.arguments.replace(/^\s*to (.*)$/i, '$1').trim();
    if (aliases.hasOwnProperty(args)) {
      args = aliases[args].trim();
    }
    const targetArgs = args.split('/', 2);
    const target = {repo: targetArgs.pop().trim()};
    target.owner = targetArgs.length ? targetArgs[0].trim() : source.owner;

    if (!target.repo || target.owner.length > 39 || target.repo.length > 100) {
      this.log(`[${sourceUrl}] Commenting: invalid arguments`, 'warn');
      if (perform) {
        await sourceGH.issues.createComment({
          ...source,
          body:
            '⚠️ The command arguments are not valid.\n\n' +
            '**Usage:** \n```sh\n/move [to ][<owner>/]<repo>\n```'
        });
      }
      return;
    }

    if (source.repo === target.repo) {
      this.log(`[${sourceUrl}] Commenting: same source and target`, 'warn');
      if (perform) {
        await sourceGH.issues.createComment({
          ...source,
          body: '⚠️ The source and target repository must be different.'
        });
      }
      return;
    }

    let targetGh;
    if (source.owner !== target.owner) {
      const appGh = await this.robot.auth();

      let [targetInstall] = await appGh.paginate(
        appGh.apps.getInstallations({per_page: 100}),
        (response, done) => {
          for (const installation of response.data) {
            if (installation.account.login === target.owner) {
              done();
              return installation.id;
            }
          }
        }
      );

      if (!targetInstall) {
        this.log(`[${sourceUrl}] Commenting: no app permission`, 'warn');
        if (perform) {
          await sourceGh.issues.createComment({
            ...source,
            body:
              '⚠️ The [GitHub App](https://github.com/apps/move) ' +
              'must be installed for the target repository.'
          });
        }
        return;
      }

      targetGh = await this.robot.auth(targetInstall);
    } else {
      targetGh = sourceGh;
    }

    let targetRepoData;
    try {
      targetRepoData = (await targetGh.repos.get(target)).data;
    } catch (e) {
      if (e.code === 404) {
        this.log(`[${sourceUrl}] Commenting: missing repository`, 'warn');
        if (perform) {
          await sourceGh.issues.createComment({
            ...source,
            body: '⚠️ The target repository does not exist.'
          });
        }
        return;
      }
      throw e;
    }

    if (!targetRepoData.has_issues || targetRepoData.archived) {
      this.log(`[${sourceUrl}] Commenting: issues disabled`, 'warn');
      if (perform) {
        await sourceGh.issues.createComment({
          ...source,
          body:
            '⚠️ The target repository must have issues enabled ' +
            'and it must not be archived.'
        });
      }
      return;
    }

    let targetPermission;
    try {
      targetPermission = (await targetGh.repos.reviewUserPermissionLevel({
        owner: target.owner,
        repo: target.repo,
        username: cmdUser
      })).data.permission;
    } catch (e) {
      if (e.code === 403) {
        this.log(`[${sourceUrl}] Commenting: no app permission`, 'warn');
        if (perform) {
          await sourceGh.issues.createComment({
            ...source,
            body:
              '⚠️ The [GitHub App](https://github.com/apps/move) ' +
              'must be installed for the target repository.'
          });
        }
        return;
      }
      throw e;
    }

    if (!['write', 'admin'].includes(targetPermission)) {
      this.log(`[${sourceUrl}] Commenting: no user permission`, 'warn');
      if (perform) {
        await sourceGh.issues.createComment({
          ...source,
          body: '⚠️ You must have write permission for the target repository.'
        });
      }
      return;
    }

    const sourceIssueData = (await sourceGh.issues.get({
      ...source,
      headers: {accept: 'application/vnd.github.v3.html+json'}
    })).data;
    const issueAuthor = sourceIssueData.user.login;
    const issueCreatedAt = moment(sourceIssueData.created_at).format(
      'MMM D, YYYY, h:mm A'
    );

    this.log(`[${sourceUrl}] Moving to ${target.owner}/${target.repo}`);
    if (perform) {
      target.number = (await targetGh.issues.create({
        owner: target.owner,
        repo: target.repo,
        title: sourceIssueData.title,
        body:
          `*@${issueAuthor} commented on ${issueCreatedAt} UTC:*\n\n` +
          `${this.getMarkdown(sourceIssueData.body_html)}\n\n` +
          `*This issue was moved by @${cmdUser} from ${sourceUrl}.*`
      })).data.number;
    }

    const targetUrl = `${target.owner}/${target.repo}/issues/${target.number}`;

    await sourceGh.paginate(
      sourceGh.issues.getComments({
        ...source,
        per_page: 100,
        headers: {accept: 'application/vnd.github.v3.html+json'}
      }),
      async response => {
        for (const comment of response.data) {
          if (comment.id === cmdCommentId && !isCmdCommentContent) {
            continue;
          }
          const commentAuthor = comment.user.login;
          const createdAt = moment(comment.created_at).format(
            'MMM D, YYYY, h:mm A'
          );

          this.log(
            `[${sourceUrl}#issuecomment-${comment.id}] ` +
              `Moving to ${targetUrl}`
          );
          if (perform) {
            await targetGh.issues.createComment({
              ...target,
              body:
                `*@${commentAuthor} commented on ${createdAt} UTC:*\n\n` +
                this.getMarkdown(comment.body_html)
            });
          }
        }
      }
    );

    if (!this.issueLocked) {
      if (deleteCommand && !isCmdCommentContent) {
        this.log(`[${sourceUrl}#issuecomment-${cmdCommentId}] Deleting`);
        if (perform) {
          try {
            await sourceGh.issues.deleteComment({
              owner: source.owner,
              repo: source.repo,
              id: cmdCommentId
            });
          } catch (e) {
            if (![403, 404].includes(e.code)) {
              throw e;
            }
          }
        }
      }

      this.log(`[${sourceUrl}] Commenting: move completed`);
      if (perform) {
        try {
          await sourceGh.issues.createComment({
            ...source,
            body: `This issue was moved by @${cmdUser} to ${targetUrl}.`
          });
        } catch (e) {
          if (e.code !== 403) {
            throw e;
          }
        }
      }
    }

    if (closeSourceIssue && this.issueOpen) {
      this.log(`[${sourceUrl}] Closing`);
      if (perform) {
        await sourceGh.issues.edit({
          ...source,
          state: 'closed'
        });
      }
    }

    if (lockSourceIssue && !this.issueLocked) {
      this.log(`[${sourceUrl}] Locking`);
      if (perform) {
        await sourceGh.issues.lock(source);
      }
    }
  }
};
