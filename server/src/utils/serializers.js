export function serializeProject(projectDocument) {
  return {
    id: projectDocument._id.toString(),
    title: projectDocument.title,
    description: projectDocument.description,
    href: projectDocument.href,
    tags: projectDocument.tags,
    sortOrder: projectDocument.sortOrder,
    imageUrl: projectDocument.imageUrl ?? null,
    createdAt: projectDocument.createdAt,
    updatedAt: projectDocument.updatedAt,
  };
}

export function serializeCertificate(certificateDocument) {
  return {
    id: certificateDocument._id.toString(),
    title: certificateDocument.title,
    description: certificateDocument.description ?? "",
    externalUrl: certificateDocument.externalUrl ?? null,
    filename: certificateDocument.originalName ?? null,
    mimeType: certificateDocument.mimeType,
    size: certificateDocument.size,
    updatedAt: certificateDocument.updatedAt,
    viewUrl: certificateDocument.cloudinaryUrl
      ? `/api/certificates/view/${certificateDocument._id}`
      : certificateDocument.externalUrl ?? null,
    downloadUrl: certificateDocument.cloudinaryUrl
      ? `/api/certificates/download/${certificateDocument._id}`
      : null,
  };
}

export function serializeResume(resumeDocument) {
  return {
    id: resumeDocument._id.toString(),
    filename: resumeDocument.originalName,
    mimeType: resumeDocument.mimeType,
    size: resumeDocument.size,
    updatedAt: resumeDocument.updatedAt,
    viewUrl: "/api/resume/view",
    downloadUrl: "/api/resume/download",
  };
}

export function serializeProfileImage(profileImageDocument) {
  return {
    id: profileImageDocument._id.toString(),
    filename: profileImageDocument.originalName,
    mimeType: profileImageDocument.mimeType,
    size: profileImageDocument.size,
    updatedAt: profileImageDocument.updatedAt,
    viewUrl: profileImageDocument.cloudinaryUrl ?? null,
  };
}

export function serializeSkill(skillDocument) {
  return {
    id: skillDocument._id.toString(),
    name: skillDocument.name,
    category: skillDocument.category,
    sortOrder: skillDocument.sortOrder,
  };
}
