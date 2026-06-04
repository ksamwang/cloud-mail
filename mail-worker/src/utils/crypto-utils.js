const encoder = new TextEncoder();

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_PREFIX = 'pbkdf2:v1:';

const saltHashUtils = {

	generateSalt(length = 16) {
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);
		return btoa(String.fromCharCode(...array));
	},


	async hashPassword(password) {
		const salt = this.generateSalt();
		const hash = await this.genHashPassword(password, salt);
		return { salt, hash };
	},

	async genHashPassword(password, salt) {
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(password),
			{ name: 'PBKDF2' },
			false,
			['deriveBits']
		);
		const hashBuffer = await crypto.subtle.deriveBits(
			{
				name: 'PBKDF2',
				salt: encoder.encode(salt),
				iterations: PBKDF2_ITERATIONS,
				hash: 'SHA-256'
			},
			key,
			256
		);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return PBKDF2_PREFIX + btoa(String.fromCharCode(...hashArray));
	},

	async verifyPassword(inputPassword, salt, storedHash) {
		// 兼容旧版 SHA-256 单次哈希（不以 pbkdf2: 开头）
		if (!storedHash.startsWith(PBKDF2_PREFIX)) {
			const data = encoder.encode(salt + inputPassword);
			const hashBuffer = await crypto.subtle.digest('SHA-256', data);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			const legacyHash = btoa(String.fromCharCode(...hashArray));
			return legacyHash === storedHash;
		}

		// 新版 PBKDF2
		const hash = await this.genHashPassword(inputPassword, salt);
		return hash === storedHash;
	},

	async needsRehash(storedHash) {
		return !storedHash.startsWith(PBKDF2_PREFIX);
	},

	genRandomPwd(length = 12) {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);
		return Array.from(array, b => chars[b % chars.length]).join('');
	}
};

export default saltHashUtils;
