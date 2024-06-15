module sandbox

import rand
import os

// NOTE: these values where fine tuned to make the sandbox be able to run code from examples and benchmarks.
const max_program_run_time_seconds = 10
const max_program_virtual_memory_limit_mb = 512
const max_program_create_file_limit_mb = 10

const spawn_root = os.getenv('SPAWN_ROOT')

// NOTE: add 1 more second to timeout number because sandbox setup takes around 1 second.
// NOTE: for some reasons `--rlimit-nproc` doesn't work in Docker container correctly, so we can't use it for now.
const common_sandbox_command = 'timeout ${max_program_run_time_seconds + 1} firejail --private --caps.drop=all
--dbus-system=none --dbus-user=none --deterministic-exit-code --deterministic-shutdown --disable-mnt --machine-id --no3d
--noinput --nonewprivs --novideo --private-cache --private-dev --restrict-namespaces --rlimit-cpu=${max_program_run_time_seconds}
--rlimit-as=${max_program_virtual_memory_limit_mb}m --rlimit-fsize=${max_program_create_file_limit_mb}m --seccomp --quiet'

const build_code_sandbox_command_template = '${common_sandbox_command} spawnlang --use-random-c-file -o {out_file_path}
{build_arguments} {code_file_path}'

const run_tests_sandbox_command_template = '${common_sandbox_command} spawnlang --use-random-c-file --show-timings false
--test {build_arguments} {code_file_path}'

const run_in_sandbox_command_template = '${common_sandbox_command} --memory-deny-write-execute {executable_path} {run_arguments}'

pub fn create_sandbox_folder() string {
	mut random_folder_name := create_random_folder_name()

	for os.exists(random_folder_name) {
		random_folder_name = create_random_folder_name()
	}

	os.mkdir(random_folder_name, os.MkdirParams{}) or { panic(err) }

	return random_folder_name
}

pub fn build_code_in_sandbox(out_file_path string, build_arguments string, code_file_path string) os.Result {
	command := prepare_command(sandbox.build_code_sandbox_command_template.replace('{out_file_path}',
		out_file_path).replace('{build_arguments}', build_arguments).replace('{code_file_path}',
		code_file_path))

	return os.execute(command)
}

pub fn run_tests_in_sandbox(build_arguments string, code_file_path string) os.Result {
	command := prepare_command(sandbox.run_tests_sandbox_command_template.replace('{build_arguments}',
		build_arguments).replace('{code_file_path}', code_file_path))

	return os.execute(command)
}

pub fn format_code_in_sandbox(code_file_path string) os.Result {
	fmt_executable_path := os.join_path(sandbox.spawn_root, 'cmd/fmt/sfmt')
	command := prepare_command('${sandbox.common_sandbox_command} ${fmt_executable_path} ${code_file_path}')

	return os.execute(command)
}

pub fn run_in_sandbox(executable_path string, run_arguments string) os.Result {
	command := prepare_command(sandbox.run_in_sandbox_command_template.replace('{executable_path}',
		executable_path).replace('{run_arguments}', run_arguments))

	return os.execute(command)
}

fn create_random_folder_name() string {
	return rand.string(15)
}

fn prepare_command(raw_string string) string {
	return raw_string
		.trim_indent()
		.replace('\r', '')
		.replace('\n', ' ')
}
