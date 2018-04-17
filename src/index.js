const commands = require('probot-commands');

const App = require('./move');

module.exports = async robot => {
  const github = await robot.auth();
  const appUrl = (await github.apps.get({})).data.html_url;

  commands(robot, 'move', async (context, command) => {
    const app = await getApp(robot, context, command);
    await app.command();
  });

  async function getApp(robot, context, command) {
    let config = await context.config('move.yml');
    if (!config) {
      config = {perform: false};
    }

    return new App(robot, context, config, command, appUrl);
  }
};
