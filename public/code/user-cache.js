import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js';

let _authUser = null;
let _profile = null;
let _authReadyResolve;
const _authReadyPromise = new Promise(res => { _authReadyResolve = res; });

/**
 * Sets the Firebase Auth user and corresponding profile from Realtime Database.
 * @param {object|null} authData - Firebase Auth user object (from getAuth().currentUser) or null.
 * @param {object|null} profileData - Corresponding user profile object or null.
 */
export function setUser(authData, profileData) {
  _authUser = authData;
  _profile = profileData;
  const auth = getAuth(); 
 // console.log('[userSession] Cached user:', _authUser, _profile);
}

/**
 * Clears the cached authentication and profile data.
 */
export function clearUser() {
  _authUser = null;
  _profile = null;
  console.log('[userSession] Cleared user cache');
}

/**
 * Returns both cached auth and profile data.
 * @returns {{ auth: object|null, profile: object|null }}
 */
export function getUser() {
  return { auth: _authUser, profile: _profile };
}

/**
 * Returns just the authenticated Firebase user (or null).
 * @returns {object|null}
 */
export function getAuthUser() {
  return _authUser;
}

/**
 * Returns just the user's profile object (or null).
 * @returns {object|null}
 */
export function getProfile() {
  return _profile;
}

/**
 * Updates fields in the cached profile. Will not create a profile if none exists.
 * @param {object} updates - Partial profile fields to merge.
 */
export function updateProfile(updates) {
  if (!_profile) {
    console.warn('[userSession] Cannot update profile cache — no profile set');
    return;
  }
  _profile = { ..._profile, ...updates };
  console.log('[userSession] Updated cached profile:', _profile);
}

/**
 * Returns true if a user is logged in (based on auth presence).
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!_authUser;
}

/**
 * Returns true if FTUE has already been completed.
 * @returns {boolean}
 */
export function hasCompletedFtue() {
  return !!_profile?.ftue;
}

/**
 * Returns true if the user is an admin (based on profile).
 * @returns {boolean}
 */
export function isAdmin() {
  return _profile?.isAdmin === true || _profile?.role === 'admin';
}


