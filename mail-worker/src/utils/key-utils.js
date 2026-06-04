const keyUtils = {
	randomHex(bytes = 8) {
		const array = new Uint8Array(bytes);
		crypto.getRandomValues(array);
		return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
	},

	async attachmentKey(prefix, content, filename, scope = '') {
		const hashBuffer = await crypto.subtle.digest('SHA-256', content);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hash = hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
		const safeScope = scope ? `${scope}/` : '';
		const ext = filename && filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '';
		return `${prefix}${safeScope}${crypto.randomUUID()}_${hash}${ext}`;
	}
};

export default keyUtils;
