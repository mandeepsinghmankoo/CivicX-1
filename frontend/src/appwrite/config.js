// src/appwrite/config.js
import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from "appwrite";
import shortner from "../ENV_Shortner/Shortner";

const resolveEndpoint = () => {
  const viteEndpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
  const candidate1 = (typeof viteEndpoint === 'string' && viteEndpoint && viteEndpoint !== 'undefined') ? viteEndpoint : null;
  const candidate2 = (typeof shortner?.appwriteUrl === 'string' && shortner.appwriteUrl && shortner.appwriteUrl !== 'undefined') ? shortner.appwriteUrl : null;
  const endpoint = candidate1 || candidate2 || 'https://cloud.appwrite.io/v1';
  if (!endpoint || endpoint === 'undefined') {
    // Helpful debug message for development
    console.error('Appwrite endpoint is not set or is invalid. Using fallback:', endpoint);
  }
  return endpoint;
};

const client = new Client()
  .setEndpoint(resolveEndpoint())
  .setProject(shortner.appwriteProjectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = shortner.appwriteDatabaseId;
export const COLLECTION_ID = shortner.appwriteIssuesCollectionId;
export const ISSUE_COLLECTION_ID = shortner.appwriteIssuesCollectionId;
export const VOTES_COLLECTION_ID = shortner.appwriteVotesCollectionId;
export { Query };

class ConfigService {

async uploadFile(file) {
  return await storage.createFile(
    shortner.appwriteBucketId,
    ID.unique(),
    file,
    [
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ]
  );
}


  getFileUrl(fileId) {
    try {
      if (!fileId) return null;
      // Use getFileView for public access
      return storage.getFileView(shortner.appwriteBucketId, fileId);
    } catch (err) {
      console.error("Error getting file URL:", err);
      return null;
    }
  }

  getFileDownloadUrl(fileId) {
    try {
      if (!fileId) return null;
      // Use getFileDownload for authenticated access
      return storage.getFileDownload(shortner.appwriteBucketId, fileId);
    } catch (err) {
      console.error("Error getting file download URL:", err);
      return null;
    }
  }



  async createIssue(issuePayload) {
    try {
      if (!issuePayload || !issuePayload.title) throw new Error("Invalid issue payload");


      const permissions = [
        Permission.read(Role.any()),
        Permission.update(Role.user(issuePayload.userId)),
        Permission.delete(Role.user(issuePayload.userId))
      ];

      // If an officials/team id is configured, allow that team to update/delete the document
      if (shortner.appwriteOfficialsTeamId) {
        try {
          permissions.push(Permission.update(Role.team(shortner.appwriteOfficialsTeamId)));
          permissions.push(Permission.delete(Role.team(shortner.appwriteOfficialsTeamId)));
        } catch (e) {
          console.warn('Could not add officials team permissions:', e);
        }
      }

      // Prepare geolocation fields if available
      const lat = issuePayload.lat !== undefined ? Number(issuePayload.lat) : undefined;
      const lng = issuePayload.lng !== undefined ? Number(issuePayload.lng) : undefined;

      const doc = await databases.createDocument(
        shortner.appwriteDatabaseId,
        shortner.appwriteIssuesCollectionId,
        ID.unique(),
        {
          title: issuePayload.title,
          description: issuePayload.description,
          category: issuePayload.category,
          severity: issuePayload.severity || 3,
          urgency: issuePayload.urgency || 60,
          status: issuePayload.status || "pending",
          createdBy: issuePayload.userId,
          votes: 0,
          fileIds: issuePayload.fileIds || [],
          address: issuePayload.address || "",
          ...(lat !== undefined ? { lat } : {}),
          ...(lng !== undefined ? { lng } : {}),
        },
        permissions
      );

      return doc;
    } catch (err) {
      console.error("Error creating issue:", err);
      throw new Error(err.message || "Issue creation failed");
    }
  }

  async createUserProfile({ userId, name, phone, role = "citizen" }) {
    try {
      const doc = await databases.createDocument(
        shortner.appwriteDatabaseId,
        shortner.appwriteUserCollectionId,
        ID.unique(),
        {
          userId,
          name,
          phone: phone || "",
          role,
        },
        [
          Permission.read(Role.users()),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );

      await account.updatePrefs({ profileDocId: doc.$id });

      return doc;
    } catch (err) {
      console.error("Error creating user profile:", err);
      throw err;
    }
  }

  async getUserProfile() {
    try {
      const user = await account.get();
      const profileDocId = user.prefs.profileDocId;
      if (!profileDocId) return null;

      const doc = await databases.getDocument(
        shortner.appwriteDatabaseId,
        shortner.appwriteUserCollectionId,
        profileDocId
      );

      return doc;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  }

  // 🔹 Updated to fetch by userId using a query
  async getUserProfileByUserId(userId) {
    try {
      const res = await databases.listDocuments(
        shortner.appwriteDatabaseId,
        shortner.appwriteUserCollectionId,
        [Query.equal("userId", userId)]
      );
      if (res.documents && res.documents.length > 0) {
        return res.documents[0];
      }
      return null;
    } catch (err) {
      console.error("Error fetching user profile by userId:", err);
      return null;
    }
  }

  async listIssues({ queries = [], limit = 50 } = {}) {
    try {
      const res = await databases.listDocuments(
        shortner.appwriteDatabaseId,
        shortner.appwriteIssuesCollectionId,
        [
          ...queries,
          Query.limit(limit),
          Query.orderDesc("$createdAt"),
        ]
      );
      return res.documents;
    } catch (err) {
      console.error("Error listing issues:", err);
      return [];
    }
  }

  async getIssueById(issueId) {
    try {
      const doc = await databases.getDocument(
        shortner.appwriteDatabaseId,
        shortner.appwriteIssuesCollectionId,
        issueId
      );
      return doc;
    } catch (err) {
      console.error("Error fetching issue by id:", err);
      throw err;
    }
  }
async updateIssueStatus(issueId, statusOrObj) {
  try {
    const existing = await this.getIssueById(issueId); // fetch current doc
    const data = typeof statusOrObj === "string" ? { status: statusOrObj } : statusOrObj;
    const updated = await databases.updateDocument(
      shortner.appwriteDatabaseId,
      shortner.appwriteIssuesCollectionId,
      issueId,
      {
        ...existing,  // keep existing fields like urgency
        ...data       // override with new fields
      }
    );
    return updated;
  } catch (err) {
    console.error("Error updating issue status:", err);
    throw err;
  }
}

  
  subscribeToIssueEvents(onCreate) {
    try {
      const channel = `databases.${shortner.appwriteDatabaseId}.collections.${shortner.appwriteIssuesCollectionId}.documents`;
      const unsubscribe = client.subscribe(channel, (response) => {
        const isCreate = response.events?.some((e) => e.endsWith(".create"));
        if (isCreate && typeof onCreate === "function") {
          onCreate(response.payload);
        }
      });
      return unsubscribe;
    } catch (err) {
      console.error("Error subscribing to issue events:", err);
      return () => {};
    }
  }

  // Voting functionality
  async voteForIssue(issueId, userId) {
    try {
      // Check if user already voted for this issue
      const existingVotes = await databases.listDocuments(
        shortner.appwriteDatabaseId,
        VOTES_COLLECTION_ID,
        [
          Query.equal("issueId", issueId),
          Query.equal("userId", userId)
        ]
      );

      if (existingVotes.documents.length > 0) {
        // User already voted, remove the vote
        await databases.deleteDocument(
          shortner.appwriteDatabaseId,
          VOTES_COLLECTION_ID,
          existingVotes.documents[0].$id
        );
        
        // Decrease vote count on issue
        const issue = await this.getIssueById(issueId);
        await databases.updateDocument(
          shortner.appwriteDatabaseId,
          shortner.appwriteIssuesCollectionId,
          issueId,
          { votes: Math.max(0, (issue.votes || 0) - 1) }
        );
        
        return { voted: false, voteCount: Math.max(0, (issue.votes || 0) - 1) };
      } else {
        // User hasn't voted, add the vote
        await databases.createDocument(
          shortner.appwriteDatabaseId,
          VOTES_COLLECTION_ID,
          ID.unique(),
          {
            issueId,
            userId,
            voteAt: new Date().toISOString()
          },
          [
            Permission.read(Role.any()),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId))
          ]
        );
        
        // Increase vote count on issue
        const issue = await this.getIssueById(issueId);
        await databases.updateDocument(
          shortner.appwriteDatabaseId,
          shortner.appwriteIssuesCollectionId,
          issueId,
          { votes: (issue.votes || 0) + 1 }
        );
        
        return { voted: true, voteCount: (issue.votes || 0) + 1 };
      }
    } catch (err) {
      console.error("Error voting for issue:", err);
      throw err;
    }
  }

  async getUserVotes(userId) {
    try {
      const votes = await databases.listDocuments(
        shortner.appwriteDatabaseId,
        VOTES_COLLECTION_ID,
        [Query.equal("userId", userId)]
      );
      return votes.documents.map(vote => vote.issueId);
    } catch (err) {
      console.error("Error fetching user votes:", err);
      return [];
    }
  }

  // Enhanced detection method for backend integration
  async detectIssueCategoryFromBase64({ imageBase64 }) {
    try {
      const response = await fetch('http://127.0.0.1:8000/Interference/classify_base64/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 })
      });
      
      if (response.ok) {
        const result = await response.json();
        return {
          label: result.predicted_class,
          confidence: result.confidence || 1.0
        };
      }
      return null;
    } catch (err) {
      console.error('Detection error:', err);
      return null;
    }
  }

  async getVoteCount(issueId) {
    try {
      const votes = await databases.listDocuments(
        shortner.appwriteDatabaseId,
        VOTES_COLLECTION_ID,
        [Query.equal("issueId", issueId)]
      );
      return votes.documents.length;
    } catch (err) {
      console.error("Error fetching vote count:", err);
      return 0;
    }
  }
}
const configService = new ConfigService();
export default configService;
