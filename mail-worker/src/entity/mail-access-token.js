import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const mailAccessToken = sqliteTable('mail_access_token', {
	tokenId: integer('token_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	accountId: integer('account_id').notNull(),
	email: text('email').notNull(),
	token: text('token').notNull(),
	expireTime: text('expire_time'),
	enabled: integer('enabled').default(1).notNull(),
	usedCount: integer('used_count').default(0).notNull(),
	createTime: text('create_time').default(sql`CURRENT_TIMESTAMP`).notNull(),
	lastUsedTime: text('last_used_time')
});

export default mailAccessToken;
