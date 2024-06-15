module runners

fn prettify(output string) string {
	mut pretty := output

	if pretty.len > 10000 {
		pretty = pretty[..9997] + '...'
	}

	nlines := pretty.count('\n')

	if nlines > 100 {
		pretty = pretty.split_into_lines()[..100].join_lines() + '\n...and ${nlines - 100} more'
	}

	return pretty
}
