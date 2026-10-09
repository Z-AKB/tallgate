"use client"

import React, { useState } from "react"
import { MockStartup } from "@/lib/data/adminMockData"
import { getErrorMessage } from "@/lib/utils"
import {
  HiOutlineMagnifyingGlass,
  HiOutlineRocketLaunch,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineXMark,
  HiOutlineBuildingOffice,
  HiOutlineDocumentChartBar,
} from "react-icons/hi2"

export default function StartupsClient({
  initialStartups,
}: {
  initialStartups: MockStartup[]
}) {
  const [startups, setStartups] = useState<MockStartup[]>(initialStartups)
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedStartup, setSelectedStartup] = useState<MockStartup | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtering
  const filteredStartups = startups.filter((item) => {
    const matchesSearch =
      item.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.founder_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.industry.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStage = stageFilter === "all" || item.stage === stageFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesStage && matchesStatus
  })

  const handleStatusChange = async (id: string, newStatus: MockStartup["status"]) => {
    if (isUpdating) return
    const previousStartups = startups
    setIsUpdating(true)
    setError(null)
    setStartups((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    )
    if (selectedStartup && selectedStartup.id === id) {
      setSelectedStartup((prev) => (prev ? { ...prev, status: newStatus } : null))
    }

    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_startup_status",
          payload: { id, status: newStatus },
        }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) throw new Error(getErrorMessage(data, "The startup status could not be updated."))
    } catch (err) {
      console.error("Failed to update startup status:", err)
      setStartups(previousStartups)
      setSelectedStartup((prev) =>
        prev && prev.id === id ? previousStartups.find((item) => item.id === id) ?? prev : prev
      )
      setError(getErrorMessage(err, "The startup status could not be updated."))
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {error}
        </div>
      )}
      {/* Control Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Startup Incubation Applications
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review venture pitches, evaluate growth stages, and admit ventures into the TallGate Incubation Hub.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
            {filteredStartups.length} Ventures
          </span>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search startup name, founder, or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stage Selector */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none"
            >
              <option value="all">All Stages</option>
              <option value="idea">Idea</option>
              <option value="prototype">Prototype</option>
              <option value="mvp">MVP</option>
              <option value="early_revenue">Early Revenue</option>
              <option value="scaling">Scaling</option>
            </select>

            {/* Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
      </div>

      {/* Startups Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        {filteredStartups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Startup & Founder</th>
                  <th className="px-6 py-4">Industry Sector</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Incubation Status</th>
                  <th className="px-6 py-4">Pitch Deck</th>
                  <th className="px-6 py-4 text-right">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStartups.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-sm">{item.company_name}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Founder: {item.founder_name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>{item.email}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{item.industry}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {item.stage.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                          item.status === "accepted"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : item.status === "under_review"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : item.status === "waitlisted"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : item.status === "declined"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {item.pitch_deck_url ? (
                        <a
                          href={item.pitch_deck_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                        >
                          <span>View Deck</span>
                          <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Not provided</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedStartup(item)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-brand-navy hover:text-white text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                      >
                        Review Pitch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <HiOutlineRocketLaunch className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No Startup Applications Match Filter</h4>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedStartup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Incubation Application #{selectedStartup.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedStartup.company_name}</h3>
              </div>
              <button
                onClick={() => setSelectedStartup(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Founder Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Founder</span>
                <span className="font-bold text-slate-900">{selectedStartup.founder_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                <a href={`mailto:${selectedStartup.email}`} className="font-semibold text-brand-primary hover:underline break-all">
                  {selectedStartup.email}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Stage</span>
                <span className="font-semibold uppercase text-indigo-700">{selectedStartup.stage}</span>
              </div>
            </div>

            {/* Pitch Problem & Solution */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Problem Statement:
                </span>
                <div className="mt-1 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  {selectedStartup.problem_statement}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Proposed Solution & Technology Architecture:
                </span>
                <div className="mt-1 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  {selectedStartup.solution_description}
                </div>
              </div>

              {selectedStartup.support_needed && selectedStartup.support_needed.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                    Requested Incubation Support:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedStartup.support_needed.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Evaluation Status Controls */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Incubation Committee Decision:
              </span>
              <div className="flex flex-wrap gap-2">
                {(["submitted", "under_review", "accepted", "waitlisted", "declined"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(selectedStartup.id, status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        selectedStartup.status === status
                          ? status === "accepted"
                            ? "bg-emerald-600 text-white shadow-md"
                            : status === "declined"
                            ? "bg-red-600 text-white shadow-md"
                            : "bg-brand-navy text-white shadow-md"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {status.replace("_", " ")}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
