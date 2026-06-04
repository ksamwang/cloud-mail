import orm from '../entity/orm';
import emailRule from '../entity/email-rule';
import { and, eq, asc } from 'drizzle-orm';
import { isDel } from '../const/entity-const';
import BizError from '../error/biz-error';

const ruleService = {
	list(c, userId) {
		return orm(c).select().from(emailRule)
			.where(eq(emailRule.userId, userId))
			.orderBy(asc(emailRule.priority), asc(emailRule.ruleId))
			.all();
	},

	async create(c, params, userId) {
		const values = this.normalize(params, userId);
		const row = await orm(c).insert(emailRule).values(values).returning().get();
		return row;
	},

	async update(c, params, userId) {
		const { ruleId } = params;
		if (!ruleId) throw new BizError('ruleId is required');
		const values = this.normalize(params, userId, true);
		await orm(c).update(emailRule).set(values)
			.where(and(eq(emailRule.ruleId, ruleId), eq(emailRule.userId, userId)))
			.run();
	},

	async delete(c, ruleId, userId) {
		await orm(c).delete(emailRule)
			.where(and(eq(emailRule.ruleId, ruleId), eq(emailRule.userId, userId)))
			.run();
	},

	async applyReceiveRules(c, emailRow) {
		if (!emailRow?.userId) return;
		const rules = await orm(c).select().from(emailRule)
			.where(and(eq(emailRule.userId, emailRow.userId), eq(emailRule.enabled, 1)))
			.orderBy(asc(emailRule.priority), asc(emailRule.ruleId))
			.all();

		for (const rule of rules) {
			const conditions = this.parseJson(rule.conditions, []);
			if (!this.matchAll(conditions, emailRow)) continue;
			const actions = this.parseJson(rule.actions, []);
			await this.runActions(c, actions, emailRow);
		}
	},

	normalize(params, userId, partial = false) {
		const values = {};
		if (!partial || params.name !== undefined) values.name = params.name || '';
		if (!partial || params.conditions !== undefined) values.conditions = JSON.stringify(params.conditions || []);
		if (!partial || params.actions !== undefined) values.actions = JSON.stringify(params.actions || []);
		if (!partial || params.priority !== undefined) values.priority = Number(params.priority) || 0;
		if (!partial || params.enabled !== undefined) values.enabled = params.enabled === 0 ? 0 : 1;
		if (!partial) values.userId = userId;
		return values;
	},

	parseJson(value, fallback) {
		try {
			return JSON.parse(value || JSON.stringify(fallback));
		} catch {
			return fallback;
		}
	},

	matchAll(conditions, emailRow) {
		if (!conditions.length) return true;
		return conditions.every(condition => this.match(condition, emailRow));
	},

	match(condition, emailRow) {
		const fieldMap = {
			from: emailRow.sendEmail,
			subject: emailRow.subject,
			to: emailRow.toEmail,
			content: emailRow.text || emailRow.content
		};
		const source = String(fieldMap[condition.field] || '').toLowerCase();
		const value = String(condition.value || '').toLowerCase();
		if (!value) return true;
		if (condition.op === 'equals') return source === value;
		if (condition.op === 'regex') {
			try {
				return new RegExp(condition.value, 'i').test(String(fieldMap[condition.field] || ''));
			} catch {
				return false;
			}
		}
		return source.includes(value);
	},

	async runActions(c, actions, emailRow) {
		const emailService = (await import('./email-service.js')).default;
		const starService = (await import('./star-service.js')).default;
		for (const action of actions) {
			if (action.action === 'delete') {
				await emailService.delete(c, { emailIds: String(emailRow.emailId) }, emailRow.userId);
			}
			if (action.action === 'star') {
				await starService.add(c, { emailId: emailRow.emailId }, emailRow.userId);
			}
			if (action.action === 'markRead') {
				await emailService.read(c, { emailIds: [emailRow.emailId] }, emailRow.userId);
			}
		}
	}
};

export default ruleService;
