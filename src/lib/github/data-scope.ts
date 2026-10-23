export function repositoryGrantFilter(githubUserId: number, repositoryId: number) {
  return `?github_user_id=eq.${githubUserId}&repository_id=eq.${repositoryId}`;
}

export function analysisJobOwnerFilter(githubUserId: number, jobId: string) {
  return `?id=eq.${encodeURIComponent(jobId)}&github_user_id=eq.${githubUserId}`;
}
