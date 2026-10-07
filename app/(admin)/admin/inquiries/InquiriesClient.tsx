"use client"

import React, { useState } from "react"
import { MockConsultation } from "@/lib/data/adminMockData"
import { formatDate } from "@/lib/utils"
import {
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineBuildingOffice2,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineCalendar,
  HiOutlineBanknotes,
  HiOutlineDocumentText,
} from "react-icons/hi2"

export default function InquiriesClient({
  initialConsultations,
}: {
  initialConsultations: MockConsultation[]
}) {
  const [consultations, setConsultations] = useState<MockConsultation[]>(initialConsultations)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedItem, setSelectedItem] = useState<MockConsultation | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [adminNoteInput, setAdminNoteInput] = useState("")

  // Filter items
  const filteredItems = consultations.filter((item) => {
    const matchesSearch =
      item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.company_name && item.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.service_interest.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (id: string, newStatus: MockConsultation["status"], notes?: string) => {
    setIsUpdating(true)
    // Optimistic UI update
    setConsultations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus, admin_notes: notes !== undefined ? notes : item.admin_notes } : item
      )
    )
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, status: newStatus, admin_notes: notes !== undefined ? notes : prev.admin_notes } : null))
    }

    try {
      await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_consultation_status",
          payload: { id, status: newStatus, admin_notes: notes },
        }),
      })
    } catch (err) {
      console.error("Failed to update status:", err)
    } finally {
      setIsUpdating(false)
    }
  }

  const openDetails = (item: MockConsultation) => {
    setSelectedItem(item)
    setAdminNoteInput(item.admin_notes || "")
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Enterprise Consultation Queue
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, triage, and follow up with enterprise scoping requests.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
            {filteredItems.length} of {consultations.length} Requests
          </span>
        </div>

        {/* Search & Status Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client, company, email, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {["all", "pending", "contacted", "in_progress", "closed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                  statusFilter === status
                    ? "bg-brand-navy text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Client & Organization</th>
                  <th className="px-6 py-4">Service Scope</th>
                  <th className="px-6 py-4">Commercials & Window</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-sm">{item.full_name}</p>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                        <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.company_name || "Independent Client"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1">
                        <span>{item.email}</span>
                        <span>•</span>
                        <span>{item.phone}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-brand-primary block">{item.service_interest}</span>
                      <p className="text-slate-500 text-[11px] mt-0.5 break-words">{item.project_scope}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {item.budget_range}
                      </span>
                      <p className="text-slate-500 text-[11px] mt-1 flex items-center gap-1">
                        <HiOutlineCalendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.timeline}</span>
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                          item.status === "pending"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : item.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : item.status === "contacted"
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-[11px]">
                      {formatDate(item.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openDetails(item)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-brand-navy hover:text-white text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                      >
                        Triage & Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <HiOutlineDocumentText className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No Consultation Requests Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query or status filter.
            </p>
          </div>
        )}
      </div>

      {/* Detail & Triage Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                  Consultation Request #{selectedItem.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedItem.full_name}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Client Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                <a href={`mailto:${selectedItem.email}`} className="font-semibold text-brand-primary hover:underline break-all">
                  {selectedItem.email}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                <a href={`tel:${selectedItem.phone}`} className="font-semibold text-slate-800 hover:underline">
                  {selectedItem.phone}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Organization</span>
                <span className="font-semibold text-slate-800">
                  {selectedItem.company_name || "Independent"}
                </span>
              </div>
            </div>

            {/* Scope & Details */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Service Interest:
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedItem.service_interest}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Project Scope & Architecture Requirements:
                </span>
                <div className="mt-1 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.project_scope}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Budget Range</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedItem.budget_range}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Timeline</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedItem.timeline}</p>
                </div>
              </div>
            </div>

            {/* Admin Notes & Status Updater */}
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Internal Admin Notes / Scoping Assessment
              </label>
              <textarea
                rows={3}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="Add meeting notes, solution architect assignment, or next steps..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none"
              />
            </div>

            {/* Status Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 mr-1">Set Status:</span>
                {(["pending", "contacted", "in_progress", "closed"] as const).map((status) => (
                  <button
                    key={status}
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(selectedItem.id, status, adminNoteInput)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      selectedItem.status === status
                        ? "bg-brand-navy text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>

              <button
                disabled={isUpdating}
                onClick={() => handleStatusChange(selectedItem.id, selectedItem.status, adminNoteInput)}
                className="w-full sm:w-auto px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
