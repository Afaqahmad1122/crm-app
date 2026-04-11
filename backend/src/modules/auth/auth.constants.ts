/** Short-lived JWT (access), sent httpOnly + returned in JSON for SPA Authorization header. */
export const AUTH_ACCESS_COOKIE_NAME = 'crm_token';

/** Long-lived opaque refresh token, httpOnly only — never sent in JSON. */
export const AUTH_REFRESH_COOKIE_NAME = 'crm_refresh';

/** @deprecated Use AUTH_ACCESS_COOKIE_NAME */
export const AUTH_COOKIE_NAME = AUTH_ACCESS_COOKIE_NAME;
