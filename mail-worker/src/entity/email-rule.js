import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const emailRule = sqliteTable('email_rule', {
	ruleId: integer('rule_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	name: text('name').default('').notNull(),
	conditions: text('conditions').default('[]').notNull(),
	actions: text('actions').default('[]').notNull(),
	priority: integer('priority').default(0).notNull(),
	enabled: integer('enabled').default(1).notNull(),
	createTime: text('create_time').default(sql`CURRENT_TIMESTAMP`)
});

export default emailRule;
