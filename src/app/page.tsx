import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LandingContent } from "@/components/marketing/landing-content";
import { getClerkUserId } from "@/lib/auth";

async function SignedInRedirect() {
  if (await getClerkUserId()) redirect("/dashboard");
  return null;
}

export default function Home() {
  return (
    <main className="landing-page relative flex flex-1 flex-col overflow-hidden">
      <Suspense fallback={null}>
        <SignedInRedirect />
      </Suspense>
      <LandingContent />
    </main>
  );
}
