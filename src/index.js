const commands = require('probot-commands');

const App = require('./move');

module.exports = robot => {
  commands(robot, 'move', async (context, command) => {
    if (command.name !== 'move') {
      return;
    }
    const app = await getApp(context, command);
    await app.command();
  });

  async function getApp(context, command) {
    let config = await context.config('move.yml');
    if (!config) {
      config = {perform: false};
    }

    return new App(context, config, robot.log, command);
  }
};
