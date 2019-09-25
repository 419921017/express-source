const Router = require('./router');

const Application = require('./application');

function createApplication() {
  return new Application();
}

exports.Router = Router;

module.exports = createApplication;
