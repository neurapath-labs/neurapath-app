import { dev } from '$app/environment';

export const BASE =
    dev
        ? 'http://localhost:8787'                   
        : 'https://backend.neurapath.shop';