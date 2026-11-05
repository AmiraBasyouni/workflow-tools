function printHelp() {
  console.log(`
Description:
  Select an output based on a matching input case.
 
Usage:
  switch <input> [<case_1> <output_1> <case_2> <output_2> ...] [--default <value>]

Options:
  -v, --version
      Print the version and exit.

  -h, --help
      Show this help message and exit.

  --default <value>
      Output to use when no case matches the input.
`);
}

export default printHelp;
