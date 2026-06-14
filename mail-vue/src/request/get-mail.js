import http from '@/axios/index.js';

export function getMailInfo(gtoken) {
    return http.get('/getMail/info', {params: {gtoken}});
}

export function getMailList(params) {
    return http.get('/getMail/list', {params});
}

export function getMailDetail(params) {
    return http.get('/getMail/detail', {params});
}

export function getMailAttachmentUrl(gtoken, attId) {
    const baseURL = import.meta.env.VITE_BASE_URL || '';
    return `${baseURL}/getMail/attachment?gtoken=${encodeURIComponent(gtoken)}&attId=${encodeURIComponent(attId)}`;
}
