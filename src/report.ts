import type { Diagnostic, Result } from "./types.js";
function messageWithReference(diagnostic: Diagnostic): string {
  return diagnostic.referenceUrl
    ? `${diagnostic.message} Reference: ${diagnostic.referenceUrl}`
    : diagnostic.message;
}
export function escapeCommand(value: string, property = false): string {
  const escaped = value
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");
  return property
    ? escaped.replaceAll(":", "%3A").replaceAll(",", "%2C")
    : escaped;
}
export function annotation(diagnostic: Diagnostic): string {
  return `::${diagnostic.severity} file=${escapeCommand(diagnostic.file, true)},line=${diagnostic.line},col=${diagnostic.column},title=${escapeCommand(diagnostic.rule, true)}::${escapeCommand(messageWithReference(diagnostic))}`;
}
export function summary(result: Result): string {
  return `${result.skillCount} skills checked, ${result.errorCount} errors, ${result.warningCount} warnings (${result.durationMs} ms)`;
}
export function textReport(result: Result): string {
  return [
    ...result.diagnostics.map(
      (d) =>
        `${JSON.stringify(d.file)}:${d.line}:${d.column} ${d.severity} [${d.rule}] ${JSON.stringify(messageWithReference(d))}`,
    ),
    summary(result),
  ].join("\n");
}
