"use client";

import { useActionState } from "react";
import { submitInquiry, type InquiryState } from "../actions/submitInquiry";

const initialState: InquiryState = { status: "idle" };

export function InquiryForm() {
  const [state, formAction, pending] = useActionState(
    submitInquiry,
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

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label htmlFor="name" className="form-label">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="form-control"
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-control"
            required
          />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label htmlFor="phone" className="form-label">
            Phone <span className="text-muted-tg">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" className="form-control" />
        </div>
        <div className="col-md-6">
          <label htmlFor="inquiry_type" className="form-label">
            What is this about?
          </label>
          <select
            id="inquiry_type"
            name="inquiry_type"
            className="form-select"
            defaultValue="consultation"
          >
            <option value="consultation">Consultation request</option>
            <option value="business_inquiry">Business inquiry</option>
            <option value="support">Support</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="message" className="form-label">
          Tell us about your project or question
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className="form-control"
          required
        />
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
        {pending ? "Sending…" : "Submit request"}
      </button>
      <p className="text-muted-tg small mt-3 mb-0">
        This is a request form, not a live calendar — a team member will
        follow up by email or phone to schedule.
      </p>
    </form>
  );
}
