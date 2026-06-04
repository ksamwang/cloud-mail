import app from '../hono/hono';
import result from '../model/result';
import pushService from '../service/push-service';
import userContext from '../security/user-context';

app.get('/push/publicKey', async (c) => {
	return c.json(result.ok({ publicKey: c.env.vapid_public_key || '' }));
});

app.post('/push/subscribe', async (c) => {
	await pushService.subscribe(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/push/unsubscribe', async (c) => {
	await pushService.unsubscribe(c, c.req.query().endpoint, userContext.getUserId(c));
	return c.json(result.ok());
});
