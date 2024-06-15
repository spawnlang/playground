module runners

import os
import sandbox

pub fn format_code(code string) !string {
	sandbox_folder_path := sandbox.create_sandbox_folder()

	defer {
		os.rmdir_all(sandbox_folder_path) or { panic(err) }
	}

	code_file_name := 'main.sp'
	code_file_path := os.join_path(sandbox_folder_path, code_file_name)

	os.write_file(code_file_path, code) or { return error('Failed to write code to sandbox.') }

	fmt_result := sandbox.format_code_in_sandbox(code_file_path)

	mut fmt_output := $if local ? {
		fmt_result.output
	} $else {
		fmt_result.output.trim_right('\n')
	}

	if fmt_result.exit_code != 0 {
		return error(prettify(fmt_output))
	}

	return fmt_output
}
