"use client"

import React from "react"
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2"

export const ADMIN_PAGE_SIZE = 25

export function getPageMeta(total: number, page: number, pageSize = ADMIN_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(total, safePage * pageSize)
  return { pageCount, safePage, from, to }
}

export default function Pagination({
  page,
  total,
  onPageChange,
  pageSize = ADMIN_PAGE_SIZE,
  itemLabel = "records",
}: {
  page: number
  total: number
  onPageChange: (page: number) => void
  pageSize?: number
  itemLabel?: string
}) {
  if (total <= pageSize) return null

  const { pageCount, safePage, from, to } = getPageMeta(total, page, pageSize)

  const buttonClass =
    "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row">
      <p className="text-[11px] text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}&ndash;{to}</span> of{" "}
        <span className="font-semibold text-slate-700">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className={buttonClass}
          aria-label="Previous page"
        >
          <HiChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <span className="text-[11px] font-semibold text-slate-600">
          Page {safePage} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= pageCount}
          className={buttonClass}
          aria-label="Next page"
        >
          Next
          <HiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
