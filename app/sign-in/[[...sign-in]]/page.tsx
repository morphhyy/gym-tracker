import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-card border border-border shadow-lg",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton:
              "bg-card border border-border text-foreground hover:bg-card-hover",
            formFieldLabel: "text-foreground",
            formFieldInput:
              "bg-background border-border text-foreground focus:border-primary",
            formButtonPrimary: "bg-primary hover:bg-primary-hover",
            footerActionLink: "text-primary hover:text-primary-hover",
          },
        }}
      />
    </div>
  );
}
