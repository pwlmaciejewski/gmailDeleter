prompt = require 'prompt'
GmailDeleter = require '../lib/gmailDeleter'
log = require 'npmlog'

prompt.start()
prompt.get [
	name: 'username'
	required: true
,
	name: 'password'
	hidden: true
	required: true
], (err, result) ->
	if err then throw err

	gmailDeleter = GmailDeleter.instance result.username, result.password
	
	gmailDeleter.on 'error', (err) ->
		log.error 'gmailDeleter', err.message

	gmailDeleter.on 'info', (message) ->
		log.info 'gmailDeleter', message

	gmailDeleter.run() 

process.on 'uncaughtException', (err) ->
	log.error 'gmailDeleter', err.message