import BizError from '../error/biz-error';

/**
 * 基于 Cloudflare KV 的令牌桶限流中间件
 * @param {Object} options
 * @param {number} options.window - 时间窗口（秒），默认 60
 * @param {number} options.max - 窗口内最大请求数，默认 60
 * @param {string} options.keyPrefix - KV key 前缀，默认 'rate'
 */
export function rateLimit({ window = 60, max = 60, keyPrefix = 'rate' } = {}) {
	return async (c, next) => {
		const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
		const path = c.req.path;
		const key = `${keyPrefix}:${ip}:${path}`;

		const current = parseInt(await c.env.kv.get(key) || '0');

		if (current >= max) {
			throw new BizError('Too many requests', 429);
		}

		await c.env.kv.put(key, String(current + 1), { expirationTtl: window });

		await next();
	};
}

/**
 * 登录/注册等敏感接口使用的严格限流
 */
export function strictRateLimit() {
	return rateLimit({ window: 60, max: 5, keyPrefix: 'rate:strict' });
}

/**
 * 通用 API 限流
 */
export function defaultRateLimit() {
	return rateLimit({ window: 60, max: 60, keyPrefix: 'rate:api' });
}
