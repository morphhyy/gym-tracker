// Clerk integration for Convex
// This file configures how Convex validates Clerk JWTs

const authConfig = {
  providers: [
    {
      // The domain of your Clerk instance
      // You can find this in the Clerk dashboard under "API Keys"
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      // The application ID from Clerk
      applicationID: "convex",
    },
  ],
};

export default authConfig;
