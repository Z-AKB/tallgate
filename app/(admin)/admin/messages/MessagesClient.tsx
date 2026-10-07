"use client"

import React, { useState } from "react"
import { MockMessage } from "@/lib/data/adminMockData"
import { formatDate } from "@/lib/utils"
import {
  HiOutlineMagnifyingGlass,
  HiOutlineEnvelope,
  HiOutlineEnvelopeOpen,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
  HiOutlineXMark,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2"

export default function MessagesClient({
  initialMessages,
}: {
  initialMessages: MockMessage[]
}) {
  const [messages, setMessages] = useState<MockMessage[]>(initialMessages)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedMessage, setSelectedMessage] = useState<MockMessage | null>(null)

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.message.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || m.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (id: string, newStatus: MockMessage["status"]) => {
    setMessages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    )
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null))
    }

    try {
      await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_message_status",
          payload: { id, status: newStatus },
        }),
      })
    } catch (err) {
      console.error("Failed to update message status:", err)
    }
  }

  const openMessage = (msg: MockMessage) => {
    setSelectedMessage(msg)
    if (msg.status === "unread") {
      handleStatusChange(msg.id, "read")
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              General Inquiries & Contact Inbox
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review public contact inquiries, institutional requests, and direct questions.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
            {filteredMessages.length} Messages
          </span>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by sender, email, subject, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {["all", "unread", "read", "responded", "archived"].map((status) => (
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

      {/* Messages List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden divide-y divide-slate-100">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={`p-5 hover:bg-slate-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                msg.status === "unread" ? "bg-indigo-50/30" : ""
              }`}
            >
              <div className="min-w-0 w-full space-y-1 sm:max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  {msg.status === "unread" ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-primary"></span>
                  ) : (
                    <HiOutlineEnvelopeOpen className="w-4 h-4 text-slate-400" />
                  )}
                  <span
                    className={`text-sm ${
                      msg.status === "unread" ? "font-extrabold text-slate-950" : "font-bold text-slate-800"
                    }`}
                  >
                    {msg.full_name}
                  </span>
                  <span className="text-xs text-slate-400 break-all">• {msg.email}</span>
                </div>

                <p
                  className={`text-xs ${
                    msg.status === "unread" ? "font-bold text-slate-900" : "font-medium text-slate-700"
                  }`}
                >
                  {msg.subject}
                </p>

                <p className="text-xs text-slate-500 whitespace-pre-wrap break-words">{msg.message}</p>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                    msg.status === "unread"
                      ? "bg-brand-primary text-white"
                      : msg.status === "responded"
                      ? "bg-emerald-100 text-emerald-800"
                      : msg.status === "archived"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {msg.status}
                </span>
                <span className="text-[11px] text-slate-400">
                  {formatDate(msg.created_at)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <HiOutlineChatBubbleLeftRight className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No Messages Found</h4>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                  Message Inbox
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedMessage.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Sender Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedMessage.full_name}</p>
              <p className="text-slate-600">{selectedMessage.email}</p>
              {selectedMessage.phone && <p className="text-slate-500">{selectedMessage.phone}</p>}
            </div>

            {/* Content */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {selectedMessage.message}
            </div>

            {/* Actions */}
            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {(["unread", "read", "responded", "archived"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedMessage.id, status)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      selectedMessage.status === status
                        ? "bg-brand-navy text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                  selectedMessage.subject
                )}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition-colors"
              >
                <HiOutlineEnvelope className="w-4 h-4" />
                <span>Reply by Email</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
