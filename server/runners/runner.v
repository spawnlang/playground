module runners

import os
import models
import logger
import srackham.pcre2
import sandbox

pub struct RunResult {
pub:
	run_output   string
	build_output string
}

// run runs the code in sandbox.
pub fn run(snippet models.CodeStorage) !RunResult {
	return run_in_sandbox(snippet, false)
}

// test runs the code as tests in sandbox.
pub fn test(snippet models.CodeStorage) !RunResult {
	return run_in_sandbox(snippet, true)
}

// get_output run the code in sandbox and returns the output.
pub fn get_output(snippet models.CodeStorage) !string {
	sandbox_folder_path := sandbox.create_sandbox_folder()

	defer {
		os.rmdir_all(sandbox_folder_path) or { panic(err) }
	}

	code_file_name := 'main.sp'
	code_file_path := os.join_path(sandbox_folder_path, code_file_name)

	os.write_file(code_file_path, snippet.code) or {
		return error('Failed to write code to sandbox.')
	}

	executable_file_path := os.join_path(sandbox_folder_path, 'out')

	build_result := sandbox.build_code_in_sandbox(executable_file_path, '${prepare_user_arguments(snippet.build_arguments)} -g',
		code_file_path)

	build_output := build_result.output.trim_right('\n')

	logger.log(snippet.code, build_output) or { eprintln('[WARNING] Failed to log code.') }

	if build_result.exit_code != 0 {
		return error(prettify(build_output))
	}

	run_result := sandbox.run_in_sandbox(executable_file_path, prepare_user_arguments(snippet.run_arguments))

	// NOTE: timeout command returns code 124 when it killed too long-running program.
	is_reached_resource_limit := run_result.exit_code == 124

	is_out_of_memory := run_result.exit_code != 0
		&& run_result.output.contains('GC Warning: Out of Memory!')

	if is_reached_resource_limit || is_out_of_memory {
		return error('The program reached the resource limit assigned to it.')
	}

	return run_result.output.trim_right('\n')
}

// run_in_sandbox is common function for running tests and code in sandbox.
fn run_in_sandbox(snippet models.CodeStorage, as_test bool) !RunResult {
	sandbox_folder_path := sandbox.create_sandbox_folder()

	defer {
		os.rmdir_all(sandbox_folder_path) or { panic(err) }
	}

	code_file_name := if as_test { 'main_test.sp' } else { 'main.sp' }
	code_file_path := os.join_path(sandbox_folder_path, code_file_name)

	os.write_file(code_file_path, snippet.code.replace('\r', '')) or {
		return error('Failed to write code to sandbox.')
	}

	if as_test {
		run_result := sandbox.run_tests_in_sandbox(prepare_user_arguments(snippet.build_arguments),
			code_file_path)

		run_output := run_result.output.trim_right('\n')

		logger.log(snippet.code, run_output) or { eprintln('[WARNING] Failed to log code.') }

		return RunResult{
			run_output: prettify(run_output)
			build_output: ''
		}
	}

	executable_file_path := os.join_path(sandbox_folder_path, 'out')

	build_result := sandbox.build_code_in_sandbox(executable_file_path, '${prepare_user_arguments(snippet.build_arguments)} --show-timings false',
		code_file_path)

	build_output := build_result.output.trim_right('\n')

	logger.log(snippet.code, build_output) or { eprintln('[WARNING] Failed to log code.') }

	if build_result.exit_code != 0 {
		return error(prettify(build_output))
	}

	run_result := sandbox.run_in_sandbox(executable_file_path, prepare_user_arguments(snippet.run_arguments))

	// NOTE: timeout command returns code 124 when it killed too long-running program.
	is_reached_resource_limit := run_result.exit_code == 124

	is_out_of_memory := run_result.exit_code != 0
		&& run_result.output.contains('GC Warning: Out of Memory!')

	if is_reached_resource_limit || is_out_of_memory {
		return error('The program reached the resource limit assigned to it.')
	}

	return RunResult{
		run_output: prettify(run_result.output.trim_right('\n'))
		build_output: prettify(build_output)
	}
}

const regex_arguments_validator = pcre2.compile('[^\\w\\d\\-=]') or { panic(err) }

fn prepare_user_arguments(args string) string {
	return runners.regex_arguments_validator.replace_all(args, ' ')
}
