const shortner = {
    appwriteUrl : String(import.meta.env.VITE_APPWRITE_ENDPOINT),
    appwriteProjectId : String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    appwriteDatabaseId : String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
    appwriteBucketId : String(import.meta.env.VITE_APPWRITE_BUCKET_ID),
    appwriteUserCollectionId : String(import.meta.env.VITE_APPWRITE_USERS_COLLECTION),
    appwriteIssuesCollectionId : String(import.meta.env.VITE_APPWRITE_ISSUES_COLLECTION),
    appwriteVotesCollectionId : String(import.meta.env.VITE_APPWRITE_VOTES_COLLECTION),
    appwriteOfficialsTeamId: import.meta.env.VITE_APPWRITE_OFFICIALS_TEAM_ID ? String(import.meta.env.VITE_APPWRITE_OFFICIALS_TEAM_ID) : undefined,
}

export default shortner;