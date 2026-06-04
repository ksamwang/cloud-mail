import analysisDao from '../dao/analysis-dao';
import orm from '../entity/orm';
import email from '../entity/email';
import { desc, count, eq, and, ne, isNotNull } from 'drizzle-orm';
import { emailConst } from '../const/entity-const';
import kvConst from '../const/kv-const';
import dayjs from 'dayjs';
import { toUtc } from '../utils/date-uitil';
const analysisService = {

	async echarts(c, params) {
		if (!this.analysisCacheEnabled(c)) {
			return await this.queryEcharts(c, params);
		}

		const cacheKey = this.echartsCacheKey(params);
		const cache = await c.env.kv.get(cacheKey, { type: 'json' });

		if (cache) {
			return cache;
		}

		return await this.refreshEchartsCacheByKey(c, cacheKey);
	},

	async refreshEchartsCacheByKey(c, cacheKey) {
		const params = this.echartsParamsByCacheKey(cacheKey);
		const data = await this.queryEcharts(c, params);
		await c.env.kv.put(cacheKey, JSON.stringify(data));
		return data;
	},

	async refreshEchartsCache(c) {
		if (!this.analysisCacheEnabled(c)) {
			return;
		}

		// 先同步统计数据到 stats 表
		await this.syncStats(c);

		const { keys } = await c.env.kv.list({ prefix: kvConst.ANALYSIS_ECHARTS });

		await Promise.all(keys.map(key => this.refreshEchartsCacheByKey(c, key.name)));
	},

	// 同步统计数据到 stats 表，避免每次 echarts 请求全表扫描
	async syncStats(c) {
		const results = await c.env.db.prepare(`
			SELECT
				(SELECT COUNT(*) FROM email WHERE type = 0 AND status != ${emailConst.status.SAVING}) AS receiveTotal,
				(SELECT COUNT(*) FROM email WHERE type = 1 AND status != ${emailConst.status.SAVING}) AS sendTotal,
				(SELECT COUNT(*) FROM email WHERE type = 0 AND is_del = 1 AND status != ${emailConst.status.SAVING}) AS delReceiveTotal,
				(SELECT COUNT(*) FROM email WHERE type = 1 AND is_del = 1 AND status != ${emailConst.status.SAVING}) AS delSendTotal,
				(SELECT COUNT(*) FROM email WHERE type = 0 AND is_del = 0 AND status != ${emailConst.status.SAVING}) AS normalReceiveTotal,
				(SELECT COUNT(*) FROM email WHERE type = 1 AND is_del = 0 AND status != ${emailConst.status.SAVING}) AS normalSendTotal,
				(SELECT COUNT(*) FROM user) AS userTotal,
				(SELECT COUNT(*) FROM user WHERE is_del = 0) AS normalUserTotal,
				(SELECT COUNT(*) FROM user WHERE is_del = 1) AS delUserTotal,
				(SELECT COUNT(*) FROM account) AS accountTotal,
				(SELECT COUNT(*) FROM account WHERE is_del = 0) AS normalAccountTotal,
				(SELECT COUNT(*) FROM account WHERE is_del = 1) AS delAccountTotal
		`).all();

		const stats = results[0];
		// 使用 INSERT OR REPLACE 写入 stats 表
		const entries = Object.entries(stats);
		const placeholders = entries.map(([k, v]) => `('${k}', ${v ?? 0})`).join(', ');
		await c.env.db.prepare(`INSERT OR REPLACE INTO stats (stat_key, stat_value) VALUES ${placeholders}`).run();
	},

	async queryEcharts(c, params) {

		const { timeZone } = params;

		let utcDate = toUtc().startOf('day');

		let localDate = utcDate.tz(timeZone);

		utcDate = dayjs(utcDate.format('YYYY-MM-DD HH:mm:ss'))

		localDate = dayjs(localDate.format('YYYY-MM-DD HH:mm:ss'))

		//获取时差
		const diffHours = localDate.diff(utcDate, 'hour',true);

		// 优先从 stats 表读取总数（cron 定期刷新），回退到全表扫描
		let numberCount;
		try {
			const statsResult = await c.env.db.prepare(
				`SELECT stat_key, stat_value FROM stats WHERE stat_key IN ('receiveTotal','sendTotal','delReceiveTotal','delSendTotal','normalReceiveTotal','normalSendTotal','userTotal','normalUserTotal','delUserTotal','accountTotal','normalAccountTotal','delAccountTotal')`
			).all();
			if (statsResult.results?.length > 0) {
				numberCount = {};
				statsResult.results.forEach(r => { numberCount[r.stat_key] = r.stat_value; });
			}
		} catch (e) { /* stats 表不存在时回退 */ }

		if (!numberCount) {
			numberCount = await analysisDao.numberCount(c);
		}


		const [
			nameRatio,
			userDayCountRaw,
			receiveDayCountRaw,
			sendDayCountRaw,
			daySendTotalRaw
		] = await Promise.all([

			orm(c)
				.select({ name: email.name, total: count() })
				.from(email)
				.where(and(eq(email.type, emailConst.type.RECEIVE), isNotNull(email.name),ne(email.name,'noreply'), ne(email.name,'')))
				.groupBy(email.name)
				.orderBy(desc(count()))
				.limit(6),


			analysisDao.userDayCount(c, diffHours),
			analysisDao.receiveDayCount(c, diffHours),
			analysisDao.sendDayCount(c, diffHours),

			c.env.kv.get(kvConst.SEND_DAY_COUNT + dayjs().format('YYYY-MM-DD')),
		]);


		const userDayCount = this.filterEmptyDay(userDayCountRaw, timeZone);
		const receiveDayCount = this.filterEmptyDay(receiveDayCountRaw, timeZone);
		const sendDayCount = this.filterEmptyDay(sendDayCountRaw, timeZone);

		const daySendTotal = daySendTotalRaw || 0;

		return {
			numberCount,
			userDayCount,
			receiveRatio: {
				nameRatio
			},
			emailDayCount: {
				receiveDayCount,
				sendDayCount
			},
			daySendTotal: Number(daySendTotal)
		};
	},

	filterEmptyDay(data, timeZone) {
		const today = toUtc().tz(timeZone).subtract(1, 'day');
		const previousDays = Array.from({ length: 15 }, (_, i) => {
			return today.subtract(i, 'day').format('YYYY-MM-DD');
		}).reverse();

		return  previousDays.map(day => {
			const index = data.findIndex(item => item.date === day)
			const total = index > - 1 ? data[index].total : 0
			return {date: day,total}
		})

	},

	echartsCacheKey(params = {}) {
		return kvConst.ANALYSIS_ECHARTS + encodeURIComponent(params.timeZone || 'UTC');
	},

	echartsParamsByCacheKey(cacheKey) {
		return {
			timeZone: decodeURIComponent(cacheKey.replace(kvConst.ANALYSIS_ECHARTS, ''))
		};
	},

	analysisCacheEnabled(c) {
		return c.env.analysis_cache === true || c.env.analysis_cache === 'true';
	}
}

export default  analysisService
