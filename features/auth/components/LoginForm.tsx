"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginWithPassword, type LoginState } from "@/features/auth/actions/login";
import { OAuthButtons } from "./OAuthButtons";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginWithPassword,
    initialState
  );

  return (
    <div className="card border p-4 p-md-5" style={{ maxWidth: 420 }}>
      <h1 className="h3 fw-bold text-navy mb-1">Sign in</h1>
      <p className="text-muted-tg mb-4">
        Welcome back to TallGate.
      </p>

      {state.error && (
        <div className="alert alert-danger py-2" role="alert">
          {state.error}
        </div>
      )}

      <form action={formAction} noValidate>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-control"
            autoComplete="email"
            required
          />
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <Link href="/forgot-password" className="small">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            className="form-control"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 mb-3"
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="d-flex align-items-center gap-3 my-3">
        <hr className="flex-grow-1" />
        <span className="text-muted-tg small">or</span>
        <hr className="flex-grow-1" />
      </div>

      <OAuthButtons />

      <p className="text-center text-muted-tg small mt-4 mb-0">
        Don&apos;t have an account? <Link href="/register">Register</Link>
      </p>
    </div>
  );
}
