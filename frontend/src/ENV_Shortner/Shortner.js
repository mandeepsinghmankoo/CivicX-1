function normalizeEnv(v) {
  return (typeof v === 'string' && v && v !== 'undefined') ? v : undefined;
}

const shortner = {
  appwriteUrl: normalizeEnv(import.meta.env.VITE_APPWRITE_ENDPOINT),
  appwriteProjectId: normalizeEnv(import.meta.env.VITE_APPWRITE_PROJECT_ID),
  appwriteDatabaseId: normalizeEnv(import.meta.env.VITE_APPWRITE_DATABASE_ID),
  appwriteBucketId: normalizeEnv(import.meta.env.VITE_APPWRITE_BUCKET_ID),
  appwriteUserCollectionId: normalizeEnv(import.meta.env.VITE_APPWRITE_USERS_COLLECTION),
  appwriteIssuesCollectionId: normalizeEnv(import.meta.env.VITE_APPWRITE_ISSUES_COLLECTION),
  appwriteVotesCollectionId: normalizeEnv(import.meta.env.VITE_APPWRITE_VOTES_COLLECTION),
  appwriteOfficialsTeamId: normalizeEnv(import.meta.env.VITE_APPWRITE_OFFICIALS_TEAM_ID),
}

export default shortner;