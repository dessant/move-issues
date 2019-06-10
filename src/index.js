const uuidV4 = require('uuid/v4');
const commands = require('probot-commands');
const getMergedConfig = require('probot-config');
const sendMessage = require('probot-messages');

const App = require('./move');
const schema = require('./schema');

module.exports = async robot => {
  const github = await robot.auth();
  const {
    name: appName,
    html_url: appUrl
  } = (await github.apps.getAuthenticated()).data;

  commands(robot, 'move', async (context, command) => {
    if (context.isBot || context.payload.issue.pull_request) {
      return;
    }
    const app = await getApp(context, command);
    if (app) {
      await app.command();
    }
  });

  async function getApp(context, command) {
    const logger = context.log.child({appName, session: uuidV4()});
    const config = await getConfig(context, logger);
    if (config) {
      return new App(robot, context, config, logger, command, appUrl);
    }
  }

  async function getConfig(context, log, file = 'move.yml') {
    let config;
    const repo = context.repo();
    try {
      let repoConfig = await getMergedConfig(context, file);
      if (!repoConfig) {
        repoConfig = {perform: false};
      }
      const {error, value} = schema.validate(repoConfig);
      if (error) {
        throw error;
      }
      config = value;
    } catch (err) {
      log.warn({err: new Error(err), repo, file}, 'Invalid config');
      if (['YAMLException', 'ValidationError'].includes(err.name)) {
        await sendMessage(
          robot,
          context,
          '[{appName}] Configuration error',
          '[{appName}]({appUrl}) has encountered a configuration error in ' +
            `\`${file}\`.\n\`\`\`\n${err.toString()}\n\`\`\``,
          {update: 'The configuration error is still occurring.'}
        );
      }
    }

    return config;
  }
};
