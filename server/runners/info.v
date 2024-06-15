module runners

import os

pub fn get_version() string {
	res := os.execute('spawnlang --version')

	if res.exit_code != 0 {
		return 'Unknown'
	}

	return res.output.replace('spawnc', 'Spawn')
}

pub fn get_doctor_output() !string {
	res := os.execute('spawnlang doctor')

	if res.exit_code != 0 {
		return error('spawnlang doctor failed, output: ${res.output}')
	}

	return res.output.all_before_last('\n')
}
