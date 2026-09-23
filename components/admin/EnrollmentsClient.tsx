"use client"

import React, { useState } from "react"
import Link from "next/link"
import { MockEnrollment } from "@/lib/data/adminMockData"
import {
  HiOutlineMagnifyingGlass,
  HiOutlineUserGroup,
  HiOutlineIdentification,
  HiOutlineCheckBadge,
} from "react-icons/hi2"

export default function EnrollmentsClient({
  initialEnrollments,
}: {
  initialEnrollments: MockEnrollment[]
}) {
  const [enrollments, setEnrollments] = useState<MockEnrollment[]>(initialEnrollments)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch =
      e.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.course_title.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Student Enrollments & Cohort Progress
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track student module completions, syllabus progression, and issue credentials upon graduation.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
            {filteredEnrollments.length} Enrollments
          </span>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, email, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {["all", "active", "completed", "dropped"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === status
                    ? "bg-brand-navy text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        {filteredEnrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Enrolled Course</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Enrolled Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-sm">{item.user_name}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{item.user_email}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-brand-navy">{item.course_title}</span>
                    </td>

                    <td className="px-6 py-4 min-w-[160px]">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                        <span>{item.progress_percent}%</span>
                        {item.progress_percent === 100 && (
                          <span className="text-status-success font-bold flex items-center gap-1">
                            <HiOutlineCheckBadge className="w-3.5 h-3.5" /> Complete
                          </span>
                        )}
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.progress_percent === 100
                              ? "bg-emerald-500"
                              : "bg-brand-primary"
                          }`}
                          style={{ width: `${item.progress_percent}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          item.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : item.status === "active"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-[11px]">
                      {new Date(item.enrolled_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {item.progress_percent === 100 ? (
                        <Link
                          href={`/admin/certificates?recipient=${encodeURIComponent(
                            item.user_name
                          )}&course=${encodeURIComponent(item.course_title)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-xs transition-colors"
                        >
                          <HiOutlineIdentification className="w-3.5 h-3.5" />
                          <span>Issue Cert</span>
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-[11px]">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <HiOutlineUserGroup className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No Student Enrollments Found</h4>
          </div>
        )}
      </div>
    </div>
  )
}
