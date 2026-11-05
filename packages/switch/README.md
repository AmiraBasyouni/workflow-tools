# Switch

Matches an input against a list of cases, and outputs the corresponding value.
If no case matches, outputs the default value if provided; otherwise, exits with a nonzero status.

## Install

```bash
npm install -g @amirab/switch
```

## Usage

```bash
switch <input> [<case_1> <output_1> ...] [--default <value>]
```

Example:

```bash
switch 'n' 'y' 'continue' 'n' 'cancel' --default 'cancel'
```

Since the input is "n", the output is "cancel". If the input didn't match any case, the default value "cancel" is the output.


Run `switch --help` to see the available options and exit codes.
