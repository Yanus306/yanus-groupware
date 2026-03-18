import { baseClient } from './baseClient'

export interface DriveFile {
  id: string
  name: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: string
  folder: string | null
}

export const getFiles = () => baseClient.get<DriveFile[]>('/drive/files')

export async function uploadFile(file: File): Promise<DriveFile> {
  const formData = new FormData()
  formData.append('file', file)
  const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
  const token = localStorage.getItem('accessToken')
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${BASE_URL}/drive/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) throw new Error(`업로드 실패: ${res.status}`)
  return res.json() as Promise<DriveFile>
}

export const deleteFile = (id: string) =>
  baseClient.delete<{ success: boolean }>(`/drive/files/${id}`)
