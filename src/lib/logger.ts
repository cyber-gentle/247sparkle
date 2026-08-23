type LogLevel = 'info' | 'warn' | 'error';

const SERVICE_NAME = '247Sparkle';
const MAX_STRING_LENGTH = 500;
const MAX_COLLECTION_LENGTH = 25;
const SENSITIVE_KEY =
  /authorization|cookie|password|secret|token|api[-_]?key|email|phone|address|account/i;

const originalConsole = {
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

let consoleBridgeInstalled = false;

function truncate(value: string) {
  return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
}

function serializeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return truncate(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncate(value.message),
    };
  }
  if (depth >= 3) return '[TRUNCATED]';
  if (Array.isArray(value)) {
    return value.slice(0, MAX_COLLECTION_LENGTH).map((item) => serializeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, MAX_COLLECTION_LENGTH)
        .map(([key, item]) => [
          key,
          SENSITIVE_KEY.test(key) ? '[REDACTED]' : serializeValue(item, depth + 1),
        ])
    );
  }

  return String(value);
}

function writeLog(level: LogLevel, event: string, metadata: Record<string, unknown> = {}) {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    service: SERVICE_NAME,
    environment: process.env.NODE_ENV || 'development',
    metadata: serializeValue(metadata),
  });

  if (consoleBridgeInstalled) {
    originalConsole[level](record);
  } else if (level === 'info') {
    console.info(record);
  } else if (level === 'warn') {
    console.warn(record);
  } else {
    console.error(record);
  }
}

export const logger = {
  info(event: string, metadata?: Record<string, unknown>) {
    writeLog('info', event, metadata);
  },
  warn(event: string, metadata?: Record<string, unknown>) {
    writeLog('warn', event, metadata);
  },
  error(event: string, metadata?: Record<string, unknown>) {
    writeLog('error', event, metadata);
  },
};

export function installStructuredConsoleBridge() {
  if (consoleBridgeInstalled) return;
  consoleBridgeInstalled = true;

  const bridge = (level: LogLevel, args: unknown[]) => {
    const [message, ...details] = args;
    writeLog('error' === level ? 'error' : level, 'legacy_console_output', {
      source: `console.${level}`,
      message: typeof message === 'string' ? message : 'Non-string console output',
      details: typeof message === 'string' ? details : args,
    });
  };

  console.info = (...args: unknown[]) => bridge('info', args);
  // eslint-disable-next-line no-console -- production instrumentation intentionally bridges legacy logs.
  console.log = (...args: unknown[]) => bridge('info', args);
  console.warn = (...args: unknown[]) => bridge('warn', args);
  console.error = (...args: unknown[]) => bridge('error', args);
}
