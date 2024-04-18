module runners

import os
import logger
import isolate
import models
import term

pub fn retrieve_cgen_code(snippet models.CodeStorage) !(string, int, string) {
	box_path, box_id := isolate.init_sandbox()
	defer {
		isolate.execute('isolate --box-id=${box_id} --cleanup')
	}

	os.write_file(os.join_path(box_path, 'main.sp'), snippet.code.replace('\r', '')) or {
		return error('Failed to write code to sandbox.')
	}

	build_res := isolate.execute('
		 ${spawn_path} --showcc -g
		 ${prepare_user_arguments(snippet.build_arguments)}
		 ${box_path}/main.sp
	')
	build_output := build_res.output.trim_right('\n')

	logger.log(snippet.code, build_output) or { eprintln('[WARNING] Failed to log code.') }

	if build_res.exit_code != 0 {
		// skip handling of errors for now
	}

	path_to_cgen := os.expand_tilde_to_home('~/spawnlang/out.c')
	cgen_file := os.read_file(path_to_cgen) or { return error('Failed to read generated C code.') }

	return cgen_file, build_res.exit_code, build_output
}
