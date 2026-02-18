import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Lazy load storage to avoid circular dependencies
let storageInstance: any = null;
let storagePromise: Promise<any> | null = null;

async function getStorage() {
  if (!storageInstance) {
    if (!storagePromise) {
      storagePromise = import("./storage").then(mod => {
        storageInstance = mod.storage;
        return storageInstance;
      });
    }
    return await storagePromise;
  }
  return storageInstance;
}

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: `${process.env.VITE_APP_URL}/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("🔐 Google Strategy Callback - Profile:", {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value,
    });

    const storage = await getStorage();
    console.log("📦 Storage instance loaded:", !!storage);

    const email = profile.emails?.[0]?.value;
    if (!email) {
      console.error("❌ No email provided from Google");
      return done(new Error("No email provided from Google"));
    }

    let user = await storage.getUserByGoogleId(profile.id);
    console.log("🔍 Searched for existing user by googleId:", {
      googleId: profile.id,
      found: !!user,
    });

    if (!user) {
      console.log("👤 Creating new user...");
      user = await storage.createUser({
        googleId: profile.id,
        email,
        name: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value,
      });
      console.log("✅ User created successfully:", { userId: user.id, email: user.email });
    } else {
      console.log("✅ User found:", { userId: user.id, email: user.email });
    }

    return done(null, user);
  } catch (error) {
    console.error("❌ Error in Google Strategy:", error);
    return done(error);
  }
}));

passport.serializeUser((user: any, done) => {
  console.log("📝 Serializing user to session:", { userId: user.id });
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    console.log("📖 Deserializing user from session:", { userId: id });
    const storage = await getStorage();
    const user = await storage.getUserById(id);
    console.log("✅ User deserialized:", {
      userId: user?.id,
      found: !!user,
      email: user?.email
    });
    done(null, user || false);
  } catch (error) {
    console.error("❌ Error deserializing user:", error);
    done(error);
  }
});

export { passport };
