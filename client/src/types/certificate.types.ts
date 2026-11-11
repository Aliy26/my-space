export type CertificateSummary = {
  id: string;
  title: string;
  description?: string | null;
  externalUrl?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  size?: number | null;
  updatedAt?: string;
  viewUrl?: string | null;
  downloadUrl?: string | null;
};
