import { defineConfig } from "vitest/config"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __configDir = dirname(__filename)
const __repoRoot = join(__configDir, "..", "..")

const DISPOSABLE_PROJECT_REF = "okyewwtmnqknkittzxvo"
const DISPOSABLE_PROJECT_HOST = `${DISPOSABLE_PROJECT_REF}.supabase.co`
const PRODUCTION_PROJECT_REF = "zlmbitphlzokjmfwldcb"
const PRODUCTION_PROJECT_HOST = `${PRODUCTION_PROJECT_REF}.supabase.co`

function die(code: string, message: string): never {
  throw new Error(`[integration-env] ${code}: ${message}`)
}

function loadEnvFile(filePath: string): Record<string, string> {
  let raw: string
  try {
    raw = readFileSync(filePath, "utf8")
  } catch {
    die("ENV_TEST_MISSING", ".env.test not found at repository root. Integration tests require disposable-project credentials in .env.test.")
  }
  const env: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIndex = trimmed.indexOf("=")
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (key) env[key] = value
  }
  return env
}

function assertValidSiteUrl(siteUrl: string): void {
  let parsed: URL
  try {
    parsed = new URL(siteUrl)
  } catch {
    die("INVALID_SITE_URL", "NEXT_PUBLIC_SITE_URL in .env.test is not a valid absolute URL.")
  }
  if (parsed.protocol !== "https:") {
    die("NON_HTTPS_SITE_URL", "NEXT_PUBLIC_SITE_URL must use https protocol.")
  }
  const host = parsed.hostname.toLowerCase()
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".test") ||
    host === "0.0.0.0" ||
    /^127(?:\.\d{1,3}){3}$/.test(host) ||
    host === "[::1]"
  ) {
    die("LOCALHOST_SITE_URL", "NEXT_PUBLIC_SITE_URL must not be a localhost or development URL.")
  }
  if (parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    die("MALFORMED_SITE_URL", "NEXT_PUBLIC_SITE_URL must be a bare origin with no credentials, path, query, or hash.")
  }
}

// Authoritative integration bootstrap: load .env.test explicitly (never .env.local),
// reject production/unknown refs, require credentials, and refuse pre-set env shadowing.
// Runs in config so env is present before test files load (Vitest setupFiles do not persist process.env across workers).
const envPath = join(__repoRoot, ".env.test")
const fileEnv = loadEnvFile(envPath)

const supabaseUrl = fileEnv.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
  die("MISSING_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL is not set in .env.test.")
}
let parsedUrl: URL
try {
  parsedUrl = new URL(supabaseUrl)
} catch {
  die("INVALID_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL in .env.test is not a valid absolute URL.")
}
if (parsedUrl.protocol !== "https:") {
  die("NON_HTTPS_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL must use https protocol.")
}
const hostname = parsedUrl.hostname.toLowerCase()
if (hostname === PRODUCTION_PROJECT_HOST) {
  die("PRODUCTION_PROJECT_DETECTED", "Refusing to run against production Supabase project. .env.test must point to the disposable project only.")
}
if (hostname !== DISPOSABLE_PROJECT_HOST) {
  die("UNRECOGNIZED_PROJECT_REF", `NEXT_PUBLIC_SUPABASE_URL host "${hostname}" does not match disposable project ref "${DISPOSABLE_PROJECT_REF}".`)
}

for (const key of ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const) {
  if (!fileEnv[key] || fileEnv[key].length < 10) {
    die("MISSING_CREDENTIAL", `${key} is missing or too short in .env.test.`)
  }
}

const siteUrl = fileEnv.NEXT_PUBLIC_SITE_URL
if (!siteUrl) {
  die("MISSING_SITE_URL", "NEXT_PUBLIC_SITE_URL is not set in .env.test.")
}
assertValidSiteUrl(siteUrl)

for (const [key, value] of Object.entries(fileEnv)) {
  if (process.env[key] !== undefined) {
    die("ENV_SHADOW_DETECTED", `${key} is already set in the process environment. Unset it before running integration tests to avoid accidental fallback.`)
  }
  process.env[key] = value
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../../", import.meta.url)),
      "server-only": fileURLToPath(new URL("../../tests/helpers/server-only.ts", import.meta.url)),
      "client-only": fileURLToPath(new URL("../../tests/helpers/server-only.ts", import.meta.url)),
    },
  },
})