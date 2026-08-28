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
      <div className="alert alert-success" role="status">
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} noValidate>
      {state.status === "error" && (
        <div className="alert alert-danger py-2" role="alert">
          {state.message}
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="business_name" className="form-label">
          Business / startup name
        </label>
        <input
          id="business_name"
          name="business_name"
          type="text"
          className="form-control"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="pitch_summary" className="form-label">
          Pitch summary
        </label>
        <textarea
          id="pitch_summary"
          name="pitch_summary"
          rows={6}
          className="form-control"
          placeholder="What are you building, for whom, and what stage are you at?"
          required
        />
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
        {pending ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
