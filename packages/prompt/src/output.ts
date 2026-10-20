import { SessionResponse } from "./types.js";

function output(sessionResponse: SessionResponse, isNullTerminated: boolean) {
  if (!sessionResponse.successful) {
    // The user can cancel the session.
    console.error(`Exit code: ${sessionResponse.exitCode}.`);
    process.exit(sessionResponse.exitCode);
  } else if (sessionResponse.successful) {
    // Print the valid output to stdout so shell scripts can capture it.
    process.stdout.write(
      `${sessionResponse.data}${isNullTerminated ? "\0" : "\n"}`,
    );
  }
}

export default output;
