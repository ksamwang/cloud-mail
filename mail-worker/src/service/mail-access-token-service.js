import dayjs from 'dayjs';
import { and, count, desc, eq, isNull, or, sql } from 'drizzle-orm';
import BizError from '../error/biz-error';
import { att } from '../entity/att';
import email from '../entity/email';
import mailAccessToken from '../entity/mail-access-token';
import orm from '../entity/orm';
import { attConst, emailConst, isDel } from '../const/entity-const';
import r2Service from './r2-service';

const TOKEN_BYTES = 32;

function randomToken() {
	const bytes = new Uint8Array(TOKEN_BYTES);
	crypto.getRandomValues(bytes);
	let binary = '';
	bytes.forEach(byte => {
		binary += String.fromCharCode(byte);
	});
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function normalizeExpireDays(expireDays) {
	const days = Number(expireDays);
	if (Number.isNaN(days) || days < 0) {
		return 30;
	}
	return Math.floor(days);
}

function publicEmailFields(row) {
	return {
		emailId: row.emailId,
		sendEmail: row.sendEmail,
		name: row.name,
		subject: row.subject,
		text: row.text,
		content: row.content,
		code: row.code,
		toEmail: row.toEmail,
		toName: row.toName,
		cc: row.cc,
		createTime: row.createTime,
		attList: row.attList || []
	};
}

const mailAccessTokenService = {
	async createForAccount(c, { userId, accountId, email, expireDays = 30 }) {
		const days = normalizeExpireDays(expireDays);
		const token = randomToken();
		const expireTime = days === 0 ? null : dayjs().add(days, 'day').format('YYYY-MM-DD HH:mm:ss');

		const row = await orm(c).insert(mailAccessToken).values({
			userId,
			accountId,
			email,
			token,
			expireTime
		}).returning().get();

		return row;
	},

	async disableByAccount(c, { userId, accountId }) {
		await orm(c).update(mailAccessToken).set({ enabled: 0 }).where(
			and(
				eq(mailAccessToken.userId, userId),
				eq(mailAccessToken.accountId, accountId),
				eq(mailAccessToken.enabled, 1)
			)
		).run();
	},

	async replaceForAccount(c, params) {
		await this.disableByAccount(c, params);
		return await this.createForAccount(c, params);
	},

	async validate(c, token) {
		const gtoken = (token || '').trim();
		if (!gtoken) {
			throw new BizError('取件令牌不能为空', 401);
		}

		const tokenRow = await orm(c).select().from(mailAccessToken).where(
			and(
				eq(mailAccessToken.token, gtoken),
				eq(mailAccessToken.enabled, 1)
			)
		).get();

		if (!tokenRow) {
			throw new BizError('取件令牌无效', 401);
		}

		if (tokenRow.expireTime && dayjs(tokenRow.expireTime).isBefore(dayjs())) {
			throw new BizError('取件令牌已过期', 401);
		}

		await orm(c).update(mailAccessToken).set({
			usedCount: sql`${mailAccessToken.usedCount} + 1`,
			lastUsedTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
		}).where(eq(mailAccessToken.tokenId, tokenRow.tokenId)).run();

		return tokenRow;
	},

	async info(c, params) {
		const tokenRow = await this.validate(c, params.gtoken);
		return {
			email: tokenRow.email,
			expireTime: tokenRow.expireTime,
			permanent: !tokenRow.expireTime
		};
	},

	async list(c, params) {
		const tokenRow = await this.validate(c, params.gtoken);
		let { num, size } = params;
		num = Number(num);
		size = Number(size);

		if (!num || num < 1) {
			num = 1;
		}
		if (!size || size < 1) {
			size = 20;
		}
		if (size > 50) {
			size = 50;
		}

		const offset = (num - 1) * size;
		const conditions = and(
			eq(email.userId, tokenRow.userId),
			eq(email.accountId, tokenRow.accountId),
			eq(email.type, emailConst.type.RECEIVE),
			eq(email.isDel, isDel.NORMAL)
		);

		const list = await orm(c).select({
			emailId: email.emailId,
			sendEmail: email.sendEmail,
			name: email.name,
			subject: email.subject,
			text: email.text,
			code: email.code,
			toEmail: email.toEmail,
			toName: email.toName,
			createTime: email.createTime
		}).from(email).where(conditions).orderBy(desc(email.emailId)).limit(size).offset(offset).all();

		const { total } = await orm(c).select({ total: count() }).from(email).where(conditions).get();

		return { list, total };
	},

	async detail(c, params) {
		const tokenRow = await this.validate(c, params.gtoken);
		const emailId = Number(params.emailId);
		if (!emailId) {
			throw new BizError('邮件不存在', 404);
		}

		const emailRow = await orm(c).select().from(email).where(
			and(
				eq(email.emailId, emailId),
				eq(email.userId, tokenRow.userId),
				eq(email.accountId, tokenRow.accountId),
				eq(email.type, emailConst.type.RECEIVE),
				eq(email.isDel, isDel.NORMAL)
			)
		).get();

		if (!emailRow) {
			throw new BizError('邮件不存在', 404);
		}

		const attList = await orm(c).select().from(att).where(
			and(
				eq(att.emailId, emailId),
				eq(att.userId, tokenRow.userId),
				eq(att.accountId, tokenRow.accountId),
				eq(att.type, attConst.type.ATT),
				or(isNull(att.contentId), eq(att.contentId, ''))
			)
		).all();

		return publicEmailFields({ ...emailRow, attList });
	},

	async attachment(c, params) {
		const tokenRow = await this.validate(c, params.gtoken);
		const attId = Number(params.attId);
		if (!attId) {
			throw new BizError('附件不存在', 404);
		}

		const attRow = await orm(c).select().from(att).where(
			and(
				eq(att.attId, attId),
				eq(att.userId, tokenRow.userId),
				eq(att.accountId, tokenRow.accountId),
				eq(att.type, attConst.type.ATT),
				or(isNull(att.contentId), eq(att.contentId, ''))
			)
		).get();

		if (!attRow) {
			throw new BizError('附件不存在', 404);
		}

		const emailRow = await orm(c).select({ emailId: email.emailId }).from(email).where(
			and(
				eq(email.emailId, attRow.emailId),
				eq(email.userId, tokenRow.userId),
				eq(email.accountId, tokenRow.accountId),
				eq(email.type, emailConst.type.RECEIVE),
				eq(email.isDel, isDel.NORMAL)
			)
		).get();

		if (!emailRow) {
			throw new BizError('附件不存在', 404);
		}

		const obj = await r2Service.getObj(c, attRow.key);
		if (!obj) {
			throw new BizError('附件文件不存在', 404);
		}

		const headers = new Headers(obj.headers || {});
		headers.set('Content-Type', attRow.mimeType || obj.httpMetadata?.contentType || headers.get('Content-Type') || 'application/octet-stream');
		headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(attRow.filename || 'attachment')}"`);

		if (obj instanceof Response) {
			return new Response(obj.body, { status: obj.status, headers });
		}

		return new Response(obj.body || await obj.arrayBuffer(), { headers });
	}
};

export default mailAccessTokenService;
