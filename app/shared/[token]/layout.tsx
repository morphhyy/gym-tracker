import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Workout Plan - GymForge",
  description:
    "View this shared workout plan and copy it to your GymForge account to start tracking your progress.",
  openGraph: {
    title: "Shared Workout Plan - GymForge",
    description:
      "View this shared workout plan and copy it to your GymForge account to start tracking your progress.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shared Workout Plan - GymForge",
    description:
      "View this shared workout plan and copy it to your GymForge account to start tracking your progress.",
  },
};

export default function SharedPlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
