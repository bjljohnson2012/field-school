import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function coursePath(slug) {
  return `/c/${encodeURIComponent(slug)}`;
}

function courseShareUrl(origin, slug) {
  return `${origin.replace(/\/$/, "")}${coursePath(slug)}`;
}

function safeReturnPath(next) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  if (
    next.startsWith("/login") ||
    next.startsWith("/office") ||
    next.startsWith("/api")
  ) {
    return "/";
  }
  return next;
}

test("course share links are public student URLs", () => {
  assert.equal(
    courseShareUrl("https://university.benjohnson.ai", "grok-bot"),
    "https://university.benjohnson.ai/c/grok-bot",
  );
  assert.equal(
    courseShareUrl("https://university.benjohnson.ai/", "new course"),
    "https://university.benjohnson.ai/c/new%20course",
  );
});

test("guest return paths stay on student pages", () => {
  assert.equal(safeReturnPath("/c/grok-bot"), "/c/grok-bot");
  assert.equal(safeReturnPath("/c/grok-bot/s/station-01"), "/c/grok-bot/s/station-01");
  assert.equal(safeReturnPath("/office"), "/");
  assert.equal(safeReturnPath("/office/new"), "/");
  assert.equal(safeReturnPath("/login"), "/");
  assert.equal(safeReturnPath("https://evil.example"), "/");
  assert.equal(safeReturnPath("//evil.example"), "/");
  assert.equal(safeReturnPath(undefined), "/");
});

test("source files keep the share, guest, theme, and campus contracts", () => {
  const share = readFileSync(join(root, "src/lib/course/share.ts"), "utf8");
  assert.match(share, /export function courseShareUrl/);
  assert.match(share, /export function safeReturnPath/);
  const login = readFileSync(join(root, "src/routes/login.tsx"), "utf8");
  assert.match(login, /Continue as guest/);
  assert.match(login, /GuestContinueDialog/);
  assert.match(login, /markGuest/);
  const campus = readFileSync(join(root, "src/routes/index.tsx"), "utf8");
  assert.match(campus, /ShareCourseButton/);
  assert.match(campus, /CampusHeroArt/);
  assert.match(campus, /GuestContinueDialog/);
  assert.doesNotMatch(campus, /hero\.jpg/);
  const dialog = readFileSync(
    join(root, "src/components/guest-continue-dialog.tsx"),
    "utf8",
  );
  assert.match(dialog, /exit the page/);
  const styles = readFileSync(join(root, "src/styles.css"), "utf8");
  assert.match(styles, /#f6f3ec/);
  assert.match(styles, /#1f5eff/);
  assert.match(styles, /html\.dark/);
  assert.match(styles, /\.md-interactive/);
  const theme = readFileSync(join(root, "src/lib/theme.tsx"), "utf8");
  assert.match(theme, /ThemeToggle/);
  const themeBoot = readFileSync(join(root, "src/lib/theme-boot.ts"), "utf8");
  assert.match(themeBoot, /jfsu-theme/);
  const header = readFileSync(join(root, "src/components/site-header.tsx"), "utf8");
  assert.match(header, /ThemeToggle/);
  assert.match(header, /\/dashboard/);
  assert.match(header, /\/inbox/);
  const migration = readFileSync(join(root, "migrations/0004_campus_chat.sql"), "utf8");
  assert.match(migration, /campus_messages/);
  const localStore = readFileSync(join(root, "src/lib/course/local-store.ts"), "utf8");
  assert.match(localStore, /sessionStorage/);
});
