const commands = require('probot-commands');

const App = require('./move');

module.exports = robot => {
  commands(robot, 'move', async (context, command) => {
    const app = await getApp(robot, context, command);
    await app.command();
  });

  async function getApp(robot, context, command) {
    let config = await context.config('move.yml');
    if (!config) {
      config = {perform: false};
    }

    return new App(robot, context, config, command);
  }
};
