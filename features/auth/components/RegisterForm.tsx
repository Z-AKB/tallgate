"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerWithPassword, type RegisterState } from "@/features/auth/actions/register";
import { OAuthButtons } from "./OAuthButtons";

const initialState: RegisterState = { status: "idle" };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerWithPassword,
    initialState
  );

  if (state.status === "success") {
    return (
      <div className="card border p-4 p-md-5" style={{ maxWidth: 420 }}>
        <div className="alert alert-success mb-0" role="status">
          {state.message}
        </div>
      </div>
    );
  }

  return (
    <div className="card border p-4 p-md-5" style={{ maxWidth: 420 }}>
      <h1 className="h3 fw-bold text-navy mb-1">Create your account</h1>
      <p className="text-muted-tg mb-4">
        Join TallGate to learn, build, or get technical help.
      </p>

      {state.status === "error" && (
        <div className="alert alert-danger py-2" role="alert">
          {state.message}
        </div>
      )}

      <form action={formAction} noValidate>
        <div className="mb-3">
          <label htmlFor="full_name" className="form-label">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            className="form-control"
            autoComplete="name"
            required
          />
        </div>

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
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="form-control"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <div className="form-text">At least 8 characters.</div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 mb-3"
          disabled={pending}
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="d-flex align-items-center gap-3 my-3">
        <hr className="flex-grow-1" />
        <span className="text-muted-tg small">or</span>
        <hr className="flex-grow-1" />
      </div>

      <OAuthButtons />

      <p className="text-center text-muted-tg small mt-4 mb-0">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
