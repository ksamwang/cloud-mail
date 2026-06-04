import http from '@/axios/index.js';

export function tokenCreate(form) {
    return http.post('/token/create', form)
}

export function tokenList() {
    return http.get('/token/list')
}

export function tokenUpdate(form) {
    return http.put('/token/update', form)
}

export function tokenDelete(tokenId) {
    return http.delete('/token/delete', {params: {tokenId}})
}
