var Browser, GmailDeleter, Unterproto, async, events;

Browser = require('zombie');

Unterproto = require('unterproto');

async = require('async');

events = require('events');

GmailDeleter = Unterproto.inherits({
  initialize: function(username, password) {
    this.browser = new Browser();
    this.username = username;
    return this.password = password;
  },
  emitInfo: function(message) {
    return this.emit('info', message);
  },
  getTitle: function() {
    return this.browser.query('title').innerHTML;
  },
  run: function(callback) {
    var _this = this;
    if (callback == null) {
      callback = function() {};
    }
    return async.series([this.logIn.bind(this), this.deleteAll.bind(this)], function(err, results) {
      if (err) {
        _this.emit('error', err);
      }
      return callback();
    });
  },
  logIn: function(callback) {
    var _this = this;
    return this.browser.visit('http://gmail.com', function(err) {
      var logInSiteTitle;
      if (err) {
        throw err;
      }
      logInSiteTitle = _this.getTitle();
      _this.browser.fill('Email', _this.username);
      _this.browser.fill('Passwd', _this.password);
      return _this.browser.pressButton('#signIn', function() {
        if (_this.getTitle() === logInSiteTitle) {
          callback(new Error('Login failed'));
          return;
        }
        _this.emitInfo('Login successful');
        return callback();
      });
    });
  },
  createWait: function(ms) {
    return function(callback) {
      this.emitInfo("Waiting for " + ms + " ms");
      return setTimeout(callback, ms);
    };
  },
  deleteAll: function(callback) {
    var deleteLoop, messagesDeleted,
      _this = this;
    messagesDeleted = 0;
    this.on('messagesDeleted', function(num) {
      messagesDeleted += num;
      return process.stdout.write('.');
    });
    deleteLoop = function(loopCallback) {
      return _this.deleteAllOnActivePage(function(err, res) {
        if (err) {
          return loopCallback(err);
        } else if (res) {
          return deleteLoop(callback);
        } else {
          return loopCallback();
        }
      });
    };
    this.emitInfo('Deleting (it will take a while)');
    return deleteLoop(function(err) {
      console.log('');
      _this.emitInfo("Messages deleted: " + messagesDeleted);
      return callback(err);
    });
  },
  deleteAllOnActivePage: function(callback) {
    var checkbox, checkboxes, messagesNum, _i, _len,
      _this = this;
    checkboxes = this.getMessageCheckboxes();
    messagesNum = checkboxes.length;
    if (!messagesNum) {
      callback(null, false);
      return;
    }
    for (_i = 0, _len = checkboxes.length; _i < _len; _i++) {
      checkbox = checkboxes[_i];
      checkbox.checked = true;
    }
    return this.browser.pressButton('input[type=submit][name=nvp_a_tr]', function() {
      _this.emit('messagesDeleted', messagesNum);
      return callback(null, true);
    });
  },
  getMessageCheckboxes: function() {
    return this.browser.document.querySelectorAll('form[name="f"] tr input[type=checkbox]');
  }
});

module.exports = GmailDeleter.inherits(Object.getPrototypeOf(new events.EventEmitter()));
