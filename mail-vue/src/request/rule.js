import http from '@/axios/index.js';

export function ruleList() {
    return http.get('/rule/list')
}

export function ruleCreate(form) {
    return http.post('/rule/create', form)
}

export function ruleUpdate(form) {
    return http.put('/rule/update', form)
}

export function ruleDelete(ruleId) {
    return http.delete('/rule/delete', {params: {ruleId}})
}
