const commands = require('probot-commands');
const getMergedConfig = require('probot-config');

const App = require('./move');
const schema = require('./schema');

module.exports = async robot => {
  const github = await robot.auth();
  const appUrl = (await github.apps.get({})).data.html_url;

  commands(robot, 'move', async (context, command) => {
    const app = await getApp(context, command);
    if (app) {
      await app.command();
    }
  });

  async function getApp(context, command) {
    const config = await getConfig(context);
    if (config) {
      return new App(robot, context, config, command, appUrl);
    }
  }

  async function getConfig(context) {
    const {owner, repo} = context.issue();
    let config;
    try {
      let repoConfig = await getMergedConfig(context, 'move.yml');
      if (!repoConfig) {
        repoConfig = {perform: false};
      }
      const {error, value} = schema.validate(repoConfig);
      if (error) {
        throw error;
      }
      config = value;
    } catch (err) {
      robot.log.warn({err: new Error(err), owner, repo}, 'Invalid config');
    }

    return config;
  }
};
