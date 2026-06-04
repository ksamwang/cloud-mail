const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, OFF: 4 };

/**
 * 统一日志模块
 * 读取 env.log_level 控制输出级别，生产环境建议设为 INFO 或 WARN
 */
export function createLogger(env) {
	const level = LEVELS[env?.log_level] ?? LEVELS.INFO;

	return {
		debug(...args) { if (level <= LEVELS.DEBUG) console.debug('[DEBUG]', ...args); },
		info(...args)  { if (level <= LEVELS.INFO)  console.info('[INFO]', ...args); },
		warn(...args)  { if (level <= LEVELS.WARN)  console.warn('[WARN]', ...args); },
		error(...args) { if (level <= LEVELS.ERROR) console.error('[ERROR]', ...args); },
	};
}
