import app from '../hono/hono';
import tokenService from '../service/token-service';
import userService from '../service/user-service';
import result from '../model/result';

// Token 管理
app.post('/token/create', async (c) => {
	const data = await tokenService.create(c, await c.req.json());
	return c.json(result.ok(data));
});

app.get('/token/list', async (c) => {
	const list = await tokenService.list(c);
	return c.json(result.ok(list));
});

app.put('/token/update', async (c) => {
	await tokenService.update(c, await c.req.json());
	return c.json(result.ok());
});

app.delete('/token/delete', async (c) => {
	await tokenService.delete(c, c.req.query().tokenId);
	return c.json(result.ok());
});

// 获取已使用的标签列表
app.get('/user/tags', async (c) => {
	const tags = await userService.getDistinctTags(c);
	return c.json(result.ok(tags));
});
