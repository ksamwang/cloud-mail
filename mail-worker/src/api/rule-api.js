import app from '../hono/hono';
import result from '../model/result';
import ruleService from '../service/rule-service';
import userContext from '../security/user-context';

app.get('/rule/list', async (c) => {
	const list = await ruleService.list(c, userContext.getUserId(c));
	return c.json(result.ok(list));
});

app.post('/rule/create', async (c) => {
	const row = await ruleService.create(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(row));
});

app.put('/rule/update', async (c) => {
	await ruleService.update(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/rule/delete', async (c) => {
	await ruleService.delete(c, c.req.query().ruleId, userContext.getUserId(c));
	return c.json(result.ok());
});
