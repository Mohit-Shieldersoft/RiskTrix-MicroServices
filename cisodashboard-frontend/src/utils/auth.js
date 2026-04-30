// const TOKEN_KEY = 'rt_access_token';
// const REFRESH_KEY = 'rt_refresh_token';

// /**
//  * NOTE:
//  * For production, prefer HttpOnly secure cookies for refresh tokens.
//  * localStorage is shown here for simplicity.
//  */

// export function setToken(token) {
//   if (token) localStorage.setItem(TOKEN_KEY, token);
// }

// export function getToken() {
//   return localStorage.getItem(TOKEN_KEY);
// }

// export function removeToken() {
//   localStorage.removeItem(TOKEN_KEY);
// }

// export function setRefreshToken(refresh) {
//   if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
// }

// export function getRefreshToken() {
//   return localStorage.getItem(REFRESH_KEY);
// }

// export function removeRefreshToken() {
//   localStorage.removeItem(REFRESH_KEY);
// }

// export function clearAuth() {
//   removeToken();
//   removeRefreshToken();
// }


// src/utils/auth.js
const ACCESS_KEY = 'rt_access_token';
const REFRESH_KEY = 'rt_refresh_token';
const USER_PROFILE_KEY = 'rt_user_profile';

export function setToken(token) {
  if (!token) return;
  localStorage.setItem(ACCESS_KEY, token);
}

export function getToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function setRefreshToken(token) {
  if (!token) return;
  localStorage.setItem(REFRESH_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(ACCESS_KEY);
}

export function removeRefreshToken() {
  localStorage.removeItem(REFRESH_KEY);
}

export function setUserProfile(profile) {
  if (!profile) return;
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

export function getUserProfile() {
  const profile = localStorage.getItem(USER_PROFILE_KEY);
  return profile ? JSON.parse(profile) : null;
}

export function removeUserProfile() {
  localStorage.removeItem(USER_PROFILE_KEY);
}

export function clearAuth() {
  removeToken();
  removeRefreshToken();
  removeUserProfile();
}
