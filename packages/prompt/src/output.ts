type UserResponse = {
  successful: boolean;
  exitCode: number;
  data: string | number | null;
};

function output(userResponse: UserResponse, isNullTerminated: boolean) {
  if (!userResponse.successful) {
    // The user can cancel the session.
    console.error(`Exit code: ${userResponse.exitCode}.`);
  } else if (userResponse.successful) {
    // Print the valid output to stdout so shell scripts can capture it.
    process.stdout.write(
      `${userResponse.data}${isNullTerminated ? "\0" : "\n"}`,
    );
  }
}

export { UserResponse };
export default output;
