import BizError from '../error/biz-error';
import orm from '../entity/orm';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import saltHashUtils from '../utils/crypto-utils';
import cryptoUtils from '../utils/crypto-utils';
import emailUtils from '../utils/email-utils';
import roleService from './role-service';
import verifyUtils from '../utils/verify-utils';
import { t } from '../i18n/i18n';
import reqUtils from '../utils/req-utils';
import dayjs from 'dayjs';
import { roleConst } from '../const/entity-const';
import email from '../entity/email';
import user from '../entity/user';
import tokenService from './token-service';

const publicService = {

	async emailList(c, params) {

		let { toEmail, content, subject, sendName, sendEmail, timeSort, num, size, type , isDel } = params

		const query = orm(c).select({
				emailId: email.emailId,
				sendEmail: email.sendEmail,
				sendName: email.name,
				subject: email.subject,
				toEmail: email.toEmail,
				toName: email.toName,
				type: email.type,
				createTime: email.createTime,
				content: email.content,
				text: email.text,
				isDel: email.isDel,
		}).from(email)

		if (!size) {
			size = 20
		}

		if (!num) {
			num = 1
		}

		size = Number(size);
		num = Number(num);

		num = (num - 1) * size;

		let conditions = []

		if (toEmail) {
			conditions.push(sql`${email.toEmail} COLLATE NOCASE LIKE ${toEmail}`)
		}

		if (sendEmail) {
			conditions.push(sql`${email.sendEmail} COLLATE NOCASE LIKE ${sendEmail}`)
		}

		if (sendName) {
			conditions.push(sql`${email.name} COLLATE NOCASE LIKE ${sendName}`)
		}

		if (subject) {
			conditions.push(sql`${email.subject} COLLATE NOCASE LIKE ${subject}`)
		}

		if (content) {
			conditions.push(sql`${email.content} COLLATE NOCASE LIKE ${content}`)
		}

		if (type || type === 0) {
			conditions.push(eq(email.type, type))
		}

		if (isDel || isDel === 0) {
			conditions.push(eq(email.isDel, isDel))
		}

		const tokenTags = c.get('tokenTags') || [];
		if (tokenTags.length > 0) {
			const taggedUsers = await orm(c)
				.select({ userId: user.userId })
				.from(user)
				.where(inArray(user.tag, tokenTags))
				.all();
			if (taggedUsers.length === 0) {
				return [];
			}
			conditions.push(inArray(email.userId, taggedUsers.map(row => row.userId)));
		}

		if (conditions.length === 1) {
			query.where(...conditions)
		} else if (conditions.length > 1) {
			query.where(and(...conditions))
		}

		if (timeSort === 'asc') {
			query.orderBy(asc(email.emailId));
		} else {
			query.orderBy(desc(email.emailId));
		}

		return query.limit(size).offset(num);

	},

	async addUser(c, params) {
		const { list } = params;

		if (list.length === 0) return;

		const tokenTags = c.get('tokenTags') || [];
		const tokenId = c.get('tokenId');
		const addUserLimit = Number(c.get('tokenAddUserLimit') || 0);
		const addUserUsed = Number(c.get('tokenAddUserUsed') || 0);

		if (addUserLimit > 0 && list.length > addUserLimit - addUserUsed) {
			throw new BizError(`配额不足：Token 剩余 ${addUserLimit - addUserUsed} 次，请求 ${list.length} 个`, 403);
		}

		for (const emailRow of list) {
			if (!verifyUtils.isEmail(emailRow.email)) {
				throw new BizError(t('notEmail'));
			}

			if (!c.env.domain.includes(emailUtils.getDomain(emailRow.email))) {
				throw new BizError(t('notEmailDomain'));
			}

			emailRow.tag = (emailRow.tag || '').trim();
			if (tokenTags.length > 0 && (!emailRow.tag || !tokenTags.includes(emailRow.tag))) {
				throw new BizError(`标签 '${emailRow.tag || '(空)'}' 超出此 token 授权范围`, 403);
			}

			const { salt, hash } = await saltHashUtils.hashPassword(
				emailRow.password || cryptoUtils.genRandomPwd()
			);

			emailRow.salt = salt;
			emailRow.hash = hash;
		}


		const activeIp = reqUtils.getIp(c);
		const { os, browser, device } = reqUtils.getUserAgent(c);
		const activeTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

		const roleList = await roleService.roleSelectUse(c);
		const defRole = roleList.find(roleRow => roleRow.isDefault === roleConst.isDefault.OPEN);

		const userList = [];

		for (const emailRow of list) {
			let { email, hash, salt, roleName, tag } = emailRow;
			let type = defRole.roleId;

			if (roleName) {
				const roleRow = roleList.find(role => role.name === roleName);
				type = roleRow ? roleRow.roleId : type;
			}

			const userSql = `INSERT INTO user (email, password, salt, type, os, browser, active_ip, create_ip, device, active_time, create_time, tag)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

			const accountSql = `INSERT INTO account (email, name, user_id)
			VALUES (?, ?, 0);`;

			userList.push(c.env.db.prepare(userSql).bind(email, hash, salt, type, os, browser, activeIp, activeIp, device, activeTime, activeTime, tag || ''));
			userList.push(c.env.db.prepare(accountSql).bind(email, emailUtils.getName(email)));

		}

		userList.push(c.env.db.prepare(`UPDATE account SET user_id = (SELECT user_id FROM user WHERE user.email = account.email) WHERE user_id = 0;`))

		try {
			await c.env.db.batch(userList);
			if (tokenId && addUserLimit > 0) {
				await tokenService.incrAddUserUsed(c, tokenId, list.length);
			}
		} catch (e) {
			if(e.message.includes('SQLITE_CONSTRAINT')) {
				throw new BizError(t('emailExistDatabase'))
			} else {
				throw e
			}
		}

	}

}

export default publicService
