/**
 * Cross-cutting technical-error logger. Writes to stderr, gated by `DEBUG` so
 * the interactive screen stays clean in normal runs (set `DEBUG=1` to surface
 * traces). Static singleton on purpose — same deliberate trade-off as
 * `ReadlineInterfaceUtil`: logging does not "genuinely vary" in this app, so it
 * earns no port. Only *technical* errors are logged; domain outcomes are
 * expected and must never spam the log.
 */
export class LoggerUtil {
  static error(error: unknown): void {
    if (!process.env.DEBUG) {
      return
    }

    console.error(error)
  }
}
