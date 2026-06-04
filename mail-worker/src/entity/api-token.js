import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const apiToken = sqliteTable('api_token', {
	tokenId: integer('token_id').primaryKey({ autoIncrement: true }).notNull(),
	name: text('name').default('').notNull(),
	token: text('token').notNull().unique(),
	tags: text('tags').default('').notNull(),
	addUserLimit: integer('add_user_limit').default(0).notNull(),
	addUserUsed: integer('add_user_used').default(0).notNull(),
	enabled: integer('enabled').default(1).notNull(),
	createTime: text('create_time').default(''),
	lastUsedTime: text('last_used_time').default('')
});
