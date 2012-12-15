Browser = require 'zombie'
Unterproto = require 'unterproto'
async = require 'async'
events = require 'events'

GmailDeleter = Unterproto.inherits
	initialize: (username, password) ->
		@browser = new Browser()
		@username = username
		@password = password

	emitInfo: (message) ->
		@emit 'info', message

	getTitle: ->
		@browser.query('title').innerHTML

	run: (callback = ->) ->
		async.series [
			@logIn.bind(@)
			@deleteAll.bind(@)
		], (err, results) =>
			if err then @emit 'error', err
			callback()

	logIn: (callback) ->
		@browser.visit 'http://gmail.com', (err) =>
			if err then throw err

			logInSiteTitle = @getTitle()

			@browser.fill 'Email', @username
			@browser.fill 'Passwd', @password
			@browser.pressButton '#signIn', =>
				if @getTitle() is logInSiteTitle 
					callback new Error 'Login failed'
					return

				@emitInfo 'Login successful'
				callback()

	createWait: (ms) ->
		(callback) ->
			@emitInfo "Waiting for #{ms} ms"
			setTimeout callback, ms

	deleteAll: (callback) ->
		messagesDeleted = 0
		@on 'messagesDeleted', (num) ->
			messagesDeleted += num
			process.stdout.write '.'

		deleteLoop = (loopCallback) =>
			@deleteAllOnActivePage (err, res) ->
				if err then loopCallback(err) 
				else if res then deleteLoop callback
				else loopCallback()

		@emitInfo 'Deleting (it will take a while)'
		deleteLoop (err) =>
			console.log ''
			@emitInfo "Messages deleted: #{messagesDeleted}"
			callback err

	deleteAllOnActivePage: (callback) ->
		checkboxes = @getMessageCheckboxes()
		messagesNum = checkboxes.length 
		if not messagesNum
			callback null, false
			return

		for checkbox in checkboxes
			checkbox.checked = true
		@browser.pressButton 'input[type=submit][name=nvp_a_tr]', =>
			@emit 'messagesDeleted', messagesNum
			callback null, true

	getMessageCheckboxes: ->
		@browser.document.querySelectorAll 'form[name="f"] tr input[type=checkbox]'

module.exports = GmailDeleter.inherits Object.getPrototypeOf(new events.EventEmitter())
