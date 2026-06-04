import http from '@/axios/index.js';

export function pushPublicKey() {
    return http.get('/push/publicKey')
}

export function pushSubscribe(subscription) {
    return http.post('/push/subscribe', {subscription})
}

export function pushUnsubscribe(endpoint) {
    return http.delete('/push/unsubscribe', {params: {endpoint}})
}
