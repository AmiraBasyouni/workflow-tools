function printHelp() {
  console.log(`
Description:
  Select an output based on a matching input case, or exit with a nonzero status if no match is found.
 
Usage:
  switch <input> [<case_1> <output_1> <case_2> <output_2> ...] [--default <value>]

Options:
  -v, --version
      Print the version and exit.

  -h, --help
      Show this help message and exit.

  --default <value>
      Output to use when no case matches the input.

Exit codes:
  0
      A matching case was found or the default was used.

  1
      No matching case was found.

  2
      Invalid arguments.
`);
}

export default printHelp;
