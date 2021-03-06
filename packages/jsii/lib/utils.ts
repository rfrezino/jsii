import log4js = require('log4js');
import ts = require('typescript');
import { DIAGNOSTICS } from './compiler';

/**
 * Obtains the relevant logger to be used for a given diagnostic message.
 *
 * @param logger     the ``log4js.Logger`` to use for emitting the message.
 * @param diagnostic the message for which a logger is requested.
 *
 * @returns a logger method of the ``logger`` for the appropriate level.
 */
export function diagnosticsLogger(logger: log4js.Logger, diagnostic: ts.Diagnostic): ((message: any, ...args: any[]) => void) | undefined {
    switch (diagnostic.category) {
    case ts.DiagnosticCategory.Error:
        if (!logger.isErrorEnabled()) { return undefined; }
        return logger.error.bind(logger);
    case ts.DiagnosticCategory.Warning:
        if (!logger.isWarnEnabled()) { return undefined; }
        return logger.warn.bind(logger);
    case ts.DiagnosticCategory.Message:
    case ts.DiagnosticCategory.Suggestion:
    default:
        if (!logger.isDebugEnabled()) { return undefined; }
        return logger.debug.bind(logger);
    }
}

export function logDiagnostic(diagnostic: ts.Diagnostic, projectRoot: string) {
    const formatDiagnosticsHost = {
        getCurrentDirectory: () => projectRoot,
        getCanonicalFileName(fileName: string) { return fileName; },
        getNewLine() { return '\n'; }
    };

    const message = diagnostic.file
                ? ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost)
                : ts.formatDiagnostics([diagnostic], formatDiagnosticsHost);

    const logFunc = diagnosticsLogger(log4js.getLogger(DIAGNOSTICS), diagnostic);
    if (!logFunc) { return; }
    logFunc(message.trim());
}
