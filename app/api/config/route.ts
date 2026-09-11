import { configured } from "@/lib/server";
export async function GET() {
  return Response.json(
    {
      configured: configured(),
      firebase: configured()
        ? {
            apiKey: process.env.FIREBASE_WEB_API_KEY,
            authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
            projectId: process.env.FIREBASE_PROJECT_ID,
          }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
