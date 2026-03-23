import { baseClient } from './baseClient'

// OpenAPI DriveFileResponse 스펙
export interface DriveFile {
  id: number
  originalName: string
  size: number
  contentType: string
  uploadedById: number
  uploadedByName: string
  createdAt: string
}

export const getFiles = () =>
  baseClient.get<DriveFile[]>('/api/v1/drive')

export const uploadFile = (file: File): Promise<DriveFile> => {
  const formData = new FormData()
  formData.append('file', file)
  return baseClient.upload<DriveFile>('/api/v1/drive/upload', formData)
}

export const deleteFile = (id: number) =>
  baseClient.delete<null>(`/api/v1/drive/${id}`)

export const downloadFile = async (id: number): Promise<string> => {
  const blob = await baseClient.download(`/api/v1/drive/${id}/download`)
  return URL.createObjectURL(blob)
}
