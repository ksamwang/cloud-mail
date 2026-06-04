import s3Service from './s3-service';
import settingService from './setting-service';
import kvObjService from './kv-obj-service';
import { storageTypeConst } from '../const/entity-const';

const r2Service = {

	async storageType(c) {

		const setting = await settingService.query(c);
		const { storageType } = setting;

		// 显式选择优先
		if (storageType === storageTypeConst.OSS) return 'OSS';
		if (storageType === storageTypeConst.S3)  return 'S3';
		if (storageType === storageTypeConst.R2)  return 'R2';
		if (storageType === storageTypeConst.KV)  return 'KV';

		// 向后兼容：未设置时沿用旧逻辑自动检测
		if (!!(setting.bucket && setting.endpoint && setting.s3AccessKey && setting.s3SecretKey)) {
			return 'S3';
		}

		if (c.env.r2) {
			return 'R2';
		}

		return 'KV';
	},

	async putObj(c, key, content, metadata) {

		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			await kvObjService.putObj(c, key, content, metadata);
		}

		if (storageType === 'R2') {
			await c.env.r2.put(key, content, {
				httpMetadata: { ...metadata }
			});
		}

		// S3 和 OSS 共用 S3 SDK
		if (storageType === 'S3' || storageType === 'OSS') {
			await s3Service.putObj(c, key, content, metadata);
		}

	},

	async getObj(c, key) {
		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			return await kvObjService.getObj(c, key);
		}

		if (storageType === 'R2') {
			return await c.env.r2.get(key);
		}

		if (storageType === 'S3' || storageType === 'OSS') {
			return await s3Service.getObj(c, key);
		}
	},

	async delete(c, key) {

		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			await kvObjService.deleteObj(c, key);
		}

		if (storageType === 'R2') {
			await c.env.r2.delete(key);
		}

		if (storageType === 'S3' || storageType === 'OSS'){
			await s3Service.deleteObj(c, key);
		}

	}

};
export default r2Service;
