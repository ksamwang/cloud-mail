import app from '../hono/hono';
import result from '../model/result';
import mailAccessTokenService from '../service/mail-access-token-service';

app.get('/getMail/info', async (c) => {
	const data = await mailAccessTokenService.info(c, c.req.query());
	return c.json(result.ok(data));
});

app.get('/getMail/list', async (c) => {
	const data = await mailAccessTokenService.list(c, c.req.query());
	return c.json(result.ok(data));
});

app.get('/getMail/detail', async (c) => {
	const data = await mailAccessTokenService.detail(c, c.req.query());
	return c.json(result.ok(data));
});

app.get('/getMail/attachment', async (c) => {
	return await mailAccessTokenService.attachment(c, c.req.query());
});
