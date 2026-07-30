import { spawn } from "node:child_process";

const [title, command, ...args] = process.argv.slice(2);

if (!title || !command) {
  process.stderr.write(
    "Usage: run-with-annotation.mjs <title> <command> [...args]\n",
  );
  process.exit(2);
}

const maximumTailLength = 8_000;
let outputTail = "";

function mirror(chunk, destination) {
  const text = chunk.toString();
  destination.write(text);
  outputTail = `${outputTail}${text}`.slice(-maximumTailLength);
}

function escapeMessage(value) {
  return value
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");
}

function escapeProperty(value) {
  return escapeMessage(value).replaceAll(":", "%3A").replaceAll(",", "%2C");
}

const child = spawn(command, args, {
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

child.stdout.on("data", (chunk) => mirror(chunk, process.stdout));
child.stderr.on("data", (chunk) => mirror(chunk, process.stderr));

const result = await new Promise((resolve) => {
  child.once("error", (error) => resolve({ code: 1, error }));
  child.once("close", (code, signal) =>
    resolve({ code: code ?? 1, signal }),
  );
});

if (result.code !== 0) {
  const failure = [
    result.error?.message,
    result.signal ? `Process ended with signal ${result.signal}.` : null,
    outputTail.trim(),
  ]
    .filter(Boolean)
    .join("\n");
  process.stdout.write(
    `::error title=${escapeProperty(title)}::${escapeMessage(failure)}\n`,
  );
}

process.exitCode = result.code;
