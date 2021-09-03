export function consoleRewrite (buffer: string) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(buffer);
}