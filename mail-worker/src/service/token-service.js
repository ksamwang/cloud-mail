import orm from '../entity/orm';
import { apiToken } from '../entity/api-token';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import BizError from '../error/biz-error';

const tokenService = {

	async create(c, params) {
		const { name, tags, addUserLimit } = params;

		if (!name || !name.trim()) {
			throw new BizError('Token name is required');
		}

		const token = uuidv4().replace(/-/g, '');

		await orm(c).insert(apiToken).values({
			name: name.trim(),
			token,
			tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
			addUserLimit: Number(addUserLimit) || 0,
			addUserUsed: 0,
			enabled: 1,
			createTime: new Date().toISOString()
		}).run();

		return { token };
	},

	async list(c) {
		return orm(c).select().from(apiToken).orderBy(desc(apiToken.tokenId)).all();
	},

	async update(c, params) {
		const { tokenId, name, tags, addUserLimit, enabled } = params;

		const updates = {};
		if (name !== undefined) updates.name = name;
		if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags.join(',') : tags;
		if (addUserLimit !== undefined) updates.addUserLimit = Number(addUserLimit);
		if (enabled !== undefined) updates.enabled = enabled;

		if (Object.keys(updates).length === 0) return;

		await orm(c).update(apiToken).set(updates).where(eq(apiToken.tokenId, tokenId)).run();
	},

	async delete(c, tokenId) {
		await orm(c).delete(apiToken).where(eq(apiToken.tokenId, tokenId)).run();
	},

	async validate(c, token) {
		return orm(c).select().from(apiToken).where(
			and(eq(apiToken.token, token), eq(apiToken.enabled, 1))
		).get();
	},

	async recordUsage(c, tokenId) {
		await orm(c).update(apiToken).set({
			lastUsedTime: new Date().toISOString()
		}).where(eq(apiToken.tokenId, tokenId)).run();
	},

	async incrAddUserUsed(c, tokenId, count) {
		await orm(c).update(apiToken).set({
			addUserUsed: apiToken.addUserUsed + count
		}).where(eq(apiToken.tokenId, tokenId)).run();
	}
};

export default tokenService;
