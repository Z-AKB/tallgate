"use client";

import { useActionState } from "react";
import {
  submitStartupApplication,
  type ApplicationState,
} from "../actions/submitApplication";

const initialState: ApplicationState = { status: "idle" };

export function ApplicationForm() {
  const [state, formAction, pending] = useActionState(
    submitStartupApplication,
    initialState
  );

  if (state.status === "success") {
    return (
      <div
        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
        role="status"
      >
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} noValidate>
      {state.status === "error" && (
        <div
          className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"
          role="alert"
        >
          {state.message}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="business_name"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          Business / startup name
        </label>
        <input
          id="business_name"
          name="business_name"
          type="text"
          className="form-input"
          required
        />
      </div>

      <div className="mb-5">
        <label
          htmlFor="pitch_summary"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          Pitch summary
        </label>
        <textarea
          id="pitch_summary"
          name="pitch_summary"
          rows={6}
          className="form-input resize-y"
          placeholder="What are you building, for whom, and what stage are you at?"
          required
        />
      </div>

      <button
        type="submit"
        className="btn-primary px-6 py-3 text-sm"
        disabled={pending}
      >
        {pending ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
