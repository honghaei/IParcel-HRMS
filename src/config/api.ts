const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()

export const API_BASE_URL = (configured || 'http://localhost/hrms-backend').replace(/\/$/, '')

export function employeeImageUrl(filename?: string | null) {
  if (!filename) return `${API_BASE_URL}/images/default.png`
  return `${API_BASE_URL}/images/${encodeURIComponent(filename)}`
}
