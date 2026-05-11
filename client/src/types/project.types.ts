export type Project = {
  id?: string
  title: string
  description: string
  href: string
  tags: string[]
  sortOrder?: number
  imageUrl?: string | null
  createdAt?: string
  updatedAt?: string
}
