import orm from '../entity/orm';
import pushSubscription from '../entity/push-subscription';
import { and, eq } from 'drizzle-orm';

const pushService = {
	async subscribe(c, params, userId) {
		const subscription = params.subscription || params;
		const keys = subscription.keys || {};
		if (!subscription.endpoint || !keys.p256dh || !keys.auth) {
			throw new Error('Invalid push subscription');
		}
		await c.env.db.prepare(`
			INSERT OR REPLACE INTO push_subscription (user_id, endpoint, p256dh, auth)
			VALUES (?, ?, ?, ?)
		`).bind(userId, subscription.endpoint, keys.p256dh, keys.auth).run();
	},

	async unsubscribe(c, endpoint, userId) {
		await orm(c).delete(pushSubscription)
			.where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.endpoint, endpoint)))
			.run();
	},

	async notifyNewEmail(c, emailRow) {
		if (!c.env.vapid_public_key || !c.env.vapid_private_key || !emailRow?.userId) return;
		const subscriptions = await orm(c).select().from(pushSubscription)
			.where(eq(pushSubscription.userId, emailRow.userId))
			.all();
		await Promise.all(subscriptions.map(row => this.send(c, row, {
			title: emailRow.subject || 'New email',
			body: `From: ${emailRow.sendEmail || ''}`,
			url: `/message?emailId=${emailRow.emailId}`
		})));
	},

	async send(c, subscription, payload) {
		try {
			const jwt = await this.vapidJwt(c, new URL(subscription.endpoint).origin);
			const res = await fetch(subscription.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'TTL': '86400',
					'Authorization': `vapid t=${jwt}, k=${c.env.vapid_public_key}`
				},
				body: JSON.stringify(payload)
			});
			if (res.status === 404 || res.status === 410) {
				await orm(c).delete(pushSubscription)
					.where(eq(pushSubscription.endpoint, subscription.endpoint))
					.run();
			}
		} catch (e) {
			console.error('Web Push failed:', e.message);
		}
	},

	async vapidJwt(c, aud) {
		const header = this.base64Url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
		const body = this.base64Url(JSON.stringify({
			aud,
			exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
			sub: c.env.vapid_subject || `mailto:${c.env.admin || 'admin@example.com'}`
		}));
		const data = `${header}.${body}`;
		const privateKey = await crypto.subtle.importKey(
			'jwk',
			JSON.parse(c.env.vapid_private_key),
			{ name: 'ECDSA', namedCurve: 'P-256' },
			false,
			['sign']
		);
		const signature = await crypto.subtle.sign(
			{ name: 'ECDSA', hash: 'SHA-256' },
			privateKey,
			new TextEncoder().encode(data)
		);
		return `${data}.${this.base64Url(signature)}`;
	},

	base64Url(value) {
		let bytes;
		if (typeof value === 'string') {
			bytes = new TextEncoder().encode(value);
		} else {
			bytes = new Uint8Array(value);
		}
		let binary = '';
		for (const byte of bytes) binary += String.fromCharCode(byte);
		return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	}
};

export default pushService;
