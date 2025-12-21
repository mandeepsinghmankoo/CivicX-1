// src/appwrite/auth.js
import { Client, Account, ID } from "appwrite";
import shortner from "../ENV_Shortner/Shortner";
import configService from "./config";

class AuthService {
  client = new Client();
  account;
  idleTimer;
  idleTime = 10 * 60 * 1000; // 10 minutes idle timeout

  constructor() {
    this.client
      .setEndpoint(shortner.appwriteUrl)
      .setProject(shortner.appwriteProjectId);

    this.account = new Account(this.client);
    this.startIdleListener();
  }

  // 🔹 Create Account + Profile
  async createAccount({ email, password, name, phone = "", role = "citizen" }) {
    try {
      // 1. Create Auth user
      const userAccount = await this.account.create(ID.unique(), email, password, name);

      // 2. Create session (logs in automatically)
      await this.account.createEmailPasswordSession(email, password);

      // 3. Create user profile in DB
      const profile = await configService.createUserProfile({
        userId: userAccount.$id,
        name,
        email,
        phone,
        role,
      });

      return { user: userAccount, profile };
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  }

  // 🔹 Login
  async login({ email, password }) {
    try {
      // clear any stale session first
      await this.account.deleteSession("current").catch(() => {});
      const session = await this.account.createEmailPasswordSession(email, password);

      this.resetIdleTimer();

      // fetch user & profile
      const user = await this.account.get();
      const profile = await configService.getUserProfileByUserId(user.$id);
      const role = profile?.role?.toLowerCase?.() || "citizen";

      return { session, user, profile: { ...profile, role }, role };
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  // 🔹 Get Current User + Profile
  async getCurrentUser() {
    try {
      const user = await this.account.get();
      const profile = await configService.getUserProfileByUserId(user.$id);
      const role = profile?.role?.toLowerCase?.() || "citizen";

      return { ...user, role, profile: { ...profile, role } };
    } catch (error) {
      if (error.code === 401) {
        return null; // not logged in
      }
      console.error("Error getting current user:", error);
      throw error;
    }
  }

  // 🔹 Logout
  async logout() {
    try {
      clearTimeout(this.idleTimer);
      return await this.account.deleteSession("current");
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  }

  // 🔹 Idle Timeout Handling
  startIdleListener() {
    ["mousemove", "keydown", "click", "scroll"].forEach((event) => {
      window.addEventListener(event, () => this.resetIdleTimer());
    });
  }

  resetIdleTimer() {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(async () => {
      try {
        await this.logout();
        window.location.href = "/login";
      } catch (e) {
        console.error("Error during auto-logout:", e);
      }
    }, this.idleTime);
  }
}

const authService = new AuthService();
export default authService;
