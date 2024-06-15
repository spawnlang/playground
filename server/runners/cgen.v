module runners

import os
import logger
import models
import sandbox

pub fn retrieve_cgen_code(snippet models.CodeStorage) !(string, int, string) {
	sandbox_folder_path := sandbox.create_sandbox_folder()

	defer {
		os.rmdir_all(sandbox_folder_path) or { panic(err) }
	}

	code_file_name := 'main.sp'
	code_file_path := os.join_path(sandbox_folder_path, code_file_name)

	os.write_file(code_file_path, snippet.code.replace('\r', '')) or {
		return error('Failed to write code to sandbox.')
	}

	c_code_file_path := os.join_path(sandbox_folder_path, 'out.c')

	build_result := sandbox.build_code_in_sandbox(c_code_file_path, '${prepare_user_arguments(snippet.build_arguments)} --showcc -g',
		code_file_path)

	build_output := build_result.output.trim_right('\n')

	logger.log(snippet.code, build_output) or { eprintln('[WARNING] Failed to log code.') }

	cgen_file := os.read_file(c_code_file_path) or {
		return error('Failed to read generated C code.')
	}

	return cgen_file, build_result.exit_code, build_output
}
