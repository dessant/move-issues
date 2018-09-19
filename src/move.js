const moment = require('moment');
const toMarkdown = require('to-markdown');

module.exports = class Move {
  constructor(robot, context, config, logger, command, appUrl) {
    this.robot = robot;
    this.context = context;
    this.config = config;
    this.log = logger;
    this.arguments = command.arguments || '';
    this.appUrl = appUrl;
  }

  getAuthorLink(user, mention = false) {
    const baseUrl = 'https://github.com';
    if (user.endsWith('[bot]')) {
      return `[${user}](${baseUrl}/apps/${user.replace('[bot]', '')})`;
    }
    if (mention) {
      return `@${user}`;
    }
    return `[${user}](${baseUrl}/${user})`;
  }

  getIssueLink(issue) {
    const repo = `${issue.owner}/${issue.repo}`;
    const number = issue.number;
    return `[${repo}#${number}](https://github.com/${repo}/issues/${number})`;
  }

  get issueOpen() {
    return this.context.payload.issue.state === 'open';
  }

  get issueLocked() {
    return this.context.payload.issue.locked;
  }

  getMarkdown(html) {
    const highlightRx = /highlight highlight-(\S+)/;
    const converters = [
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
      },
      {
        filter: function(node) {
          return (
            node.nodeName === 'A' &&
            /(?:user|team)-mention/.test(node.className)
          );
        },
        replacement: (content, node) => {
          if (this.config.keepContentMentions) {
            if (/user-mention/.test(node.className)) {
              return content;
            }
            // team mentions only work within the same org
            if (this.sameOwner) {
              return content;
            }
          }
          return `[${content.replace(/^@/, '')}](${node.href})`;
        }
      }
    ];
    return toMarkdown(html, {
      gfm: true,
      converters
    });
  }

  async getCommonLabels(sourceGh, targetGh, source, target) {
    let commonLabels = [];

    const sourceLabels = await sourceGh.paginate(
      sourceGh.issues.getIssueLabels({...source, per_page: 100}),
      res => res.data.map(item => item.name)
    );

    if (sourceLabels.length) {
      const targetLabels = await targetGh.paginate(
        targetGh.issues.getLabels({...target, per_page: 100}),
        res => res.data.map(item => item.name)
      );

      if (targetLabels.length) {
        commonLabels = sourceLabels.filter(item => targetLabels.includes(item));
      }
    }

    return commonLabels;
  }

  async command() {
    const {payload, github: sourceGh} = this.context;
    const {
      perform,
      closeSourceIssue,
      lockSourceIssue,
      deleteCommand,
      mentionAuthors,
      moveLabels,
      aliases
    } = this.config;

    const source = this.context.issue();
    const cmdUser = payload.comment.user.login;
    const cmdCommentId = payload.comment.id;
    const isCmdCommentContent = payload.comment.body.trim().includes('\n');

    this.log.info(
      {
        source,
        cmdUser,
        cmdCommentId,
        arguments: this.arguments.substring(0, 200),
        perform
      },
      'Command received'
    );

    const sourcePermission = (await sourceGh.repos.reviewUserPermissionLevel({
      owner: source.owner,
      repo: source.repo,
      username: cmdUser
    })).data.permission;
    if (!['write', 'admin'].includes(sourcePermission)) {
      this.log.warn({source, cmdUser, perform}, 'No user permission to source');
      if (perform) {
        await sourceGh.issues.createComment({
          ...source,
          body: '⚠️ You must have write permission for the source repository.'
        });
      }
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
      this.log.warn(
        {
          source,
          target,
          cmdUser,
          cmdCommentId,
          arguments: this.arguments.substring(0, 200),
          perform
        },
        'Invalid command arguments'
      );
      if (perform) {
        await sourceGh.issues.createComment({
          ...source,
          body:
            '⚠️ The command arguments are not valid.\n\n' +
            '**Usage:** \n```sh\n/move [to ][<owner>/]<repo>\n```'
        });
      }
      return;
    }

    this.sameOwner = source.owner === target.owner;
    if (this.sameOwner && source.repo === target.repo) {
      this.log.warn({source, target, perform}, 'Same source and target');
      if (perform) {
        await sourceGh.issues.createComment({
          ...source,
          body: '⚠️ The source and target repository must be different.'
        });
      }
      return;
    }

    let targetInstall;
    const appGh = await this.robot.auth();
    try {
      targetInstall = (await appGh.apps.findRepoInstallation(target)).data.id;
    } catch (e) {
      if (e.code === 404) {
        this.log.warn({target, perform}, 'Missing target');
        if (perform) {
          await sourceGh.issues.createComment({
            ...source,
            body:
              `⚠️ The [GitHub App](${this.appUrl}) ` +
              'must be installed for the target repository.'
          });
        }
        return;
      }
      throw e;
    }

    let targetGh;
    if (!this.sameOwner) {
      targetGh = await this.robot.auth(targetInstall);
    } else {
      targetGh = sourceGh;
    }

    const targetRepoData = (await targetGh.repos.get(target)).data;

    if (!targetRepoData.has_issues) {
      this.log.warn({target, perform}, 'Issues disabled for target');
      if (perform) {
        await sourceGh.issues.createComment({
          ...source,
          body: '⚠️ Issues must be enabled for the target repository.'
        });
      }
      return;
    }

    if (targetRepoData.archived) {
      this.log.warn({target, perform}, 'Archived target');
      if (perform) {
        await sourceGh.issues.createComment({
          ...source,
          body: '⚠️ The target repository must not be archived.'
        });
      }
      return;
    }

    if (
      !this.sameOwner ||
      payload.repository.private ||
      targetRepoData.private
    ) {
      const targetPermission = (await targetGh.repos.reviewUserPermissionLevel({
        owner: target.owner,
        repo: target.repo,
        username: cmdUser
      })).data.permission;

      if (!['write', 'admin'].includes(targetPermission)) {
        this.log.warn(
          {target, cmdUser, perform},
          'No user permission to target'
        );
        if (perform) {
          await sourceGh.issues.createComment({
            ...source,
            body: '⚠️ You must have write permission for the target repository.'
          });
        }
        return;
      }
    }

    const sourceIssueData = (await sourceGh.issues.get({
      ...source,
      headers: {accept: 'application/vnd.github.v3.html+json'}
    })).data;
    const issueAuthor = sourceIssueData.user.login;
    const issueCreatedAt = moment(sourceIssueData.created_at).format(
      'MMM D, YYYY, h:mm A'
    );

    let commonLabels = [];
    if (moveLabels) {
      commonLabels = await this.getCommonLabels(
        sourceGh,
        targetGh,
        source,
        target
      );
    }

    const cmdAuthorMention = this.getAuthorLink(cmdUser);

    this.log.info({source, target, perform}, 'Moving issue');
    if (perform) {
      const issueAuthorMention = this.getAuthorLink(
        issueAuthor,
        mentionAuthors
      );
      target.number = (await targetGh.issues.create({
        owner: target.owner,
        repo: target.repo,
        title: sourceIssueData.title,
        body:
          `*${issueAuthorMention} commented on ${issueCreatedAt} UTC:*\n\n` +
          `${this.getMarkdown(sourceIssueData.body_html)}\n\n` +
          `*This issue was moved by ${cmdAuthorMention} from ` +
          `${this.getIssueLink(source)}.*`,
        labels: commonLabels
      })).data.number;
    }
    this.log.info({target, perform}, 'Issue created');

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

          this.log.info(
            {
              source,
              target,
              sourceCommentId: comment.id,
              perform
            },
            'Moving comment'
          );

          let targetCommentId;
          if (perform) {
            const commentAuthorMention = this.getAuthorLink(
              commentAuthor,
              mentionAuthors
            );
            targetCommentId = (await targetGh.issues.createComment({
              ...target,
              body:
                `*${commentAuthorMention} commented on ${createdAt} UTC:*\n\n` +
                this.getMarkdown(comment.body_html)
            })).data.id;
          }
          this.log.info(
            {
              source,
              target,
              sourceCommentId: comment.id,
              targetCommentId,
              perform
            },
            'Comment created'
          );
        }
      }
    );

    if (!this.issueLocked) {
      if (deleteCommand && !isCmdCommentContent) {
        this.log.info({source, cmdCommentId, perform}, 'Deleting command');
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

      this.log.info({source, target, perform}, 'Move completed');
      if (perform) {
        try {
          await sourceGh.issues.createComment({
            ...source,
            body:
              `This issue was moved by ${cmdAuthorMention} to ` +
              `${this.getIssueLink(target)}.`
          });
        } catch (e) {
          if (e.code !== 403) {
            throw e;
          }
        }
      }
    }

    if (closeSourceIssue && this.issueOpen) {
      this.log.info({source, perform}, 'Closing');
      if (perform) {
        await sourceGh.issues.edit({...source, state: 'closed'});
      }
    }

    if (lockSourceIssue && !this.issueLocked) {
      this.log.info({source, perform}, 'Locking');
      if (perform) {
        await sourceGh.issues.lock(source);
      }
    }
  }
};
