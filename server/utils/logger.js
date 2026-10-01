const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 }
const activeLevel = LEVELS[process.env.LOG_LEVEL || 'info']

function write(level, message, meta) {
  if (LEVELS[level] > activeLevel) return

  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  }

  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else console.log(line)
}

export const logger = {
  error: (message, meta) => write('error', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  info: (message, meta) => write('info', message, meta),
  debug: (message, meta) => write('debug', message, meta),
}
