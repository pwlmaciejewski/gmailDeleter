var GmailDeleter, log, prompt;

prompt = require('prompt');

GmailDeleter = require('../lib/gmailDeleter');

log = require('npmlog');

prompt.start();

prompt.get([
  {
    name: 'username',
    required: true
  }, {
    name: 'password',
    hidden: true,
    required: true
  }
], function(err, result) {
  var gmailDeleter;
  if (err) {
    throw err;
  }
  gmailDeleter = GmailDeleter.instance(result.username, result.password);
  gmailDeleter.on('error', function(err) {
    return log.error('gmailDeleter', err.message);
  });
  gmailDeleter.on('info', function(message) {
    return log.info('gmailDeleter', message);
  });
  return gmailDeleter.run();
});

process.on('uncaughtException', function(err) {
  return log.error('gmailDeleter', err.message);
});
