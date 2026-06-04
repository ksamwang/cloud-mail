import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const pushSubscription = sqliteTable('push_subscription', {
	subscriptionId: integer('subscription_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	endpoint: text('endpoint').notNull(),
	p256dh: text('p256dh').notNull(),
	auth: text('auth').notNull(),
	createTime: text('create_time').default(sql`CURRENT_TIMESTAMP`)
});

export default pushSubscription;
