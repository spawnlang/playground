module main

import vweb
import runners

struct VersionResponse {
	version string
	error   string
}

// version endpoint is used to get the version of the Spawn.
// Returns VersionResponse with version or error.
@['/version'; post]
fn (mut app Server) version() vweb.Result {
	return app.json(VersionResponse{
		version: runners.get_version()
	})
}
