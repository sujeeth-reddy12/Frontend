const AUTH_STORAGE_KEY = "loggedInUser";
const AUTH_COOKIE_KEY = "complaintAuth";
const AUTH_TOKEN_KEY = "authToken";

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

function parseJwtClaims(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}

function setCookie(name, value, days) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiry.toUTCString()}; path=/`;
}

function getCookie(name) {
  const prefix = `${name}=`;
  const cookies = document.cookie ? document.cookie.split(";") : [];

  for (const rawCookie of cookies) {
    const cookie = rawCookie.trim();
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length));
    }
  }

  return null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function normalizeRole(role) {
  if (!role) {
    return "";
  }

  if (typeof role === "object") {
    const fromObject = role.name || role.value || role.authority;
    if (fromObject) {
      return normalizeRole(fromObject);
    }
    return "";
  }

  const raw = String(role).trim().toUpperCase();
  if (raw.startsWith("ROLE_")) {
    return raw.replace("ROLE_", "");
  }

  return raw;
}

function normalizeId(rawId) {
  const numericId = Number(rawId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  return numericId;
}

function safeParse(jsonValue) {
  if (!jsonValue) {
    return null;
  }

  try {
    return JSON.parse(jsonValue);
  } catch {
    return null;
  }
}

function buildSessionUser(user, tokenClaims) {
  // Prefer the server-returned role over JWT claims to avoid stale token issues
  const normalizedRole = normalizeRole(user?.role || user?.userType || tokenClaims?.role);

  return {
    id: normalizeId(user?.id ?? tokenClaims?.userId),
    name: user?.name || user?.username || "",
    email: user?.email || tokenClaims?.sub || "",
    role: normalizedRole,
    message: user?.message,
  };
}

function readStorageItem(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageItem(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore browser storage write failures and rely on cookie fallback.
  }
}

function removeStorageItem(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore browser storage remove failures.
  }
}

function buildToken(user, token) {
  if (token) {
    return token;
  }

  const seed = `${user?.id || "guest"}-${user?.email || "user"}-${Date.now()}`;
  return `session-${btoa(seed)}`;
}

export function persistUserSession(user, token) {
  const authToken = buildToken(user, token);
  const tokenClaims = parseJwtClaims(authToken);
  const sessionUser = buildSessionUser(user, tokenClaims);
  // Store token inside the session object so each user carries their own token
  const sessionWithToken = { ...sessionUser, token: authToken };
  const serialized = JSON.stringify(sessionWithToken);

  writeStorageItem(localStorage, AUTH_STORAGE_KEY, serialized);
  writeStorageItem(sessionStorage, AUTH_STORAGE_KEY, serialized);
  writeStorageItem(localStorage, AUTH_TOKEN_KEY, authToken);
  writeStorageItem(sessionStorage, AUTH_TOKEN_KEY, authToken);
  setCookie(AUTH_COOKIE_KEY, serialized, 7);

  return sessionUser;
}

export function getStoredUser() {
  const token = getStoredToken();
  const tokenClaims = parseJwtClaims(token);

  const localUser = safeParse(readStorageItem(localStorage, AUTH_STORAGE_KEY));
  if (localUser) {
    return buildSessionUser(localUser, tokenClaims);
  }

  const sessionUser = safeParse(readStorageItem(sessionStorage, AUTH_STORAGE_KEY));
  if (sessionUser) {
    writeStorageItem(localStorage, AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    return buildSessionUser(sessionUser, tokenClaims);
  }

  const cookieUser = safeParse(getCookie(AUTH_COOKIE_KEY));
  if (cookieUser) {
    const serialized = JSON.stringify(cookieUser);
    writeStorageItem(localStorage, AUTH_STORAGE_KEY, serialized);
    writeStorageItem(sessionStorage, AUTH_STORAGE_KEY, serialized);
    return buildSessionUser(cookieUser, tokenClaims);
  }

  if (tokenClaims) {
    return buildSessionUser({}, tokenClaims);
  }

  return null;
}

export function getStoredToken() {
  // Prefer the token stored inside the session object (tied to this specific user)
  const localUser = safeParse(readStorageItem(localStorage, AUTH_STORAGE_KEY));
  if (localUser?.token) return localUser.token;

  const sessionUser = safeParse(readStorageItem(sessionStorage, AUTH_STORAGE_KEY));
  if (sessionUser?.token) return sessionUser.token;

  return (
    readStorageItem(localStorage, AUTH_TOKEN_KEY) ||
    readStorageItem(sessionStorage, AUTH_TOKEN_KEY) ||
    ""
  );
}

export function clearUserSession() {
  removeStorageItem(localStorage, AUTH_STORAGE_KEY);
  removeStorageItem(sessionStorage, AUTH_STORAGE_KEY);
  removeStorageItem(localStorage, AUTH_TOKEN_KEY);
  removeStorageItem(sessionStorage, AUTH_TOKEN_KEY);
  removeStorageItem(localStorage, "uname");
  removeStorageItem(sessionStorage, "uname");
  removeStorageItem(localStorage, "userType");
  removeStorageItem(sessionStorage, "userType");
  removeStorageItem(localStorage, "isAdmin");
  removeStorageItem(sessionStorage, "isAdmin");
  removeStorageItem(localStorage, "upsw");
  removeStorageItem(sessionStorage, "upsw");
  deleteCookie(AUTH_COOKIE_KEY);
}

export function hasRequiredRole(user, expectedRole) {
  return normalizeRole(user?.role) === normalizeRole(expectedRole);
}

export function hasValidUserId(user) {
  return Number.isInteger(user?.id) && user.id > 0;
}
