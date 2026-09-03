import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, RequestHandler, Response } from "express";

const COOKIE_NAME = "wiki_agent_session";
const SESSION_DAYS = 30;
const SESSION_TTL_SECONDS = SESSION_DAYS * 24 * 60 * 60;
const password = process.env.APP_PASSWORD?.trim() ?? "";
const sessionSecret = process.env.APP_SESSION_SECRET?.trim() ?? "";

if (!password || !sessionSecret) {
  throw new Error("APP_PASSWORD and APP_SESSION_SECRET must be configured.");
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload: string) {
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url");
}

function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

function validToken(token?: string) {
  if (!token) return false;
  const [payload, providedSignature, extra] = token.split(".");
  if (!payload || !providedSignature || extra || !equal(signature(payload), providedSignature)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof parsed.exp === "number" && parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function cookies(req: Request) {
  return Object.fromEntries((req.headers.cookie ?? "").split(";").map((part) => part.trim().split(/=(.*)/s, 2)).filter(([key]) => key));
}

function secureRequest(req: Request) {
  return req.secure || req.headers["x-forwarded-proto"] === "https";
}

function setSessionCookie(req: Request, res: Response, value: string, maxAge: number) {
  res.cookie(COOKIE_NAME, value, { httpOnly: true, sameSite: "strict", secure: secureRequest(req), path: "/", maxAge });
}

export function isAuthenticated(req: Request) {
  return validToken(cookies(req)[COOKIE_NAME]);
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (isAuthenticated(req)) return next();
  res.status(401).json({ error: "Authentication required." });
};

export function login(req: Request, res: Response) {
  const candidate = typeof req.body?.password === "string" ? req.body.password : "";
  if (!equal(candidate, password)) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }
  setSessionCookie(req, res, issueToken(), SESSION_TTL_SECONDS * 1000);
  res.json({ authenticated: true, expiresInDays: SESSION_DAYS });
}

export function logout(req: Request, res: Response) {
  setSessionCookie(req, res, "", 0);
  res.json({ authenticated: false });
}
