# Prompt

A minimal CLI prompting tool for collecting and validating user input.

## Install

```bash
npm install -g @amirab/prompt
```

## Usage

```bash
prompt <message> <options>
```

Examples:

```bash
prompt "Enter your name: " --type string
```

```bash
prompt "Enter the quantity of books: " --type number
```

Run `prompt --help` to see the available options.
