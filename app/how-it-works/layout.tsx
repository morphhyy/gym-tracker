import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works - GymForge",
  description:
    "Learn how GymForge helps you create AI-powered workout plans, track every set and rep, visualize your progress with charts, and get smart suggestions for progression.",
  openGraph: {
    title: "How It Works - GymForge",
    description:
      "Learn how GymForge helps you create AI-powered workout plans, track every set and rep, visualize your progress with charts, and get smart suggestions for progression.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works - GymForge",
    description:
      "Learn how GymForge helps you create AI-powered workout plans, track every set and rep, visualize your progress with charts, and get smart suggestions for progression.",
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
