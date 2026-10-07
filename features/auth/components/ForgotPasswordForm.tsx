"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/features/auth/actions/forgotPassword";

const initialState: ForgotPasswordState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  );

  return (
    <div className="card border p-4 p-md-5" style={{ maxWidth: 420 }}>
      <h1 className="h3 fw-bold text-navy mb-1">Reset your password</h1>
      <p className="text-muted-tg mb-4">
        Enter the email on your account and we&apos;ll send a reset link.
      </p>

      {state.status === "success" ? (
        <div className="alert alert-success mb-0" role="status">
          {state.message}
        </div>
      ) : (
        <form action={formAction} noValidate>
          {state.status === "error" && (
            <div className="alert alert-danger py-2" role="alert">
              {state.message}
            </div>
          )}
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
          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={pending}
          >
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="text-center text-muted-tg small mt-4 mb-0">
        <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}
