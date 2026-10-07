const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

function getCalendarDateParts(dateString: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1]

  if (year < 1 || !daysInMonth || day < 1 || day > daysInMonth) return null

  return { year, month, day }
}

export function formatCertificateIssueDate(
  dateString: string,
  format: "numeric" | "long" = "numeric"
): string {
  const date = getCalendarDateParts(dateString)
  if (!date) return dateString

  if (format === "long") {
    return `${date.day} ${MONTH_NAMES[date.month - 1]} ${date.year}`
  }

  return `${date.month}/${date.day}/${date.year}`
}
