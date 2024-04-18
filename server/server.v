module main

import vweb
import os
import db.sqlite
import isolate
import models
import flag

const default_port = 5555

struct Server {
	vweb.Context
pub mut:
	db sqlite.DB
}

// get_request_code retrieves information about the code to run from the request.
// If the code is not provided, an error is returned.
fn (mut app Server) get_request_code() !models.CodeStorage {
	return models.CodeStorage{
		id: 0
		code: app.form['code'] or { return error('No code was provided.') }
		hash: ''
		build_arguments: app.form['build-arguments'] or { '' }
		run_arguments: app.form['run-arguments'] or { '' }
		run_configuration: app.form['run-configuration'] or { '0' }.int()
	}
}

// add_new_code adds a new code snippet to the database.
fn (mut app Server) add_new_code(snippet models.CodeStorage) {
	println('Added new code snippet with hash: ${snippet.hash}, run configuration: ${snippet.run_configuration}')

	count := sql app.db {
		select count from models.CodeStorage where hash == snippet.hash
	} or { 0 }

	if count != 0 {
		println('Code with ${snippet.hash} already added')
		return
	}

	sql app.db {
		insert snippet into models.CodeStorage
	} or { panic(err) }
}

// get_saved_code retrieves a code snippet from the database by its hash.
fn (mut app Server) get_saved_code(hash string) ?models.CodeStorage {
	found := sql app.db {
		select from models.CodeStorage where hash == hash
	} or { panic(err) }

	if found.len == 0 {
		return none
	}

	return found.last()
}

// init_once initializes the server.
fn (mut app Server) init_once() {
	app.db = sqlite.connect('code_storage.db') or { panic(err) }
	sql app.db {
		create table models.CodeStorage
	} or { panic(err) }
	isolate.execute('isolate --cleanup')
	app.handle_static('./www/public', true)
	app.serve_static('/', './www/public/')
}

fn main() {
	mut fp := flag.new_flag_parser(os.args)
	fp.application('Playground server')
	fp.version('v0.0.1')
	fp.description('A playground server for Spawn language.')
	fp.skip_executable()
	port := fp.int('port', `p`, default_port, 'port to run the server on')

	fp.finalize() or {
		eprintln(err)
		println(fp.usage())
		return
	}

	mut app := &Server{}
	app.init_once()
	vweb.run(app, port)
}
