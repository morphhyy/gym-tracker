"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessageSquare, X, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Generate a simple browser fingerprint for rate limiting
function generateFingerprint(): string {
  if (typeof window === "undefined") return "";
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ];
  return components.join("|");
}

type FeedbackCategory = "feature_request" | "bug" | "general";

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("feature_request");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Use ref to cache fingerprint - generated lazily on first use
  const fingerprintRef = useRef<string | null>(null);
  
  const getFingerprint = () => {
    if (fingerprintRef.current === null) {
      fingerprintRef.current = generateFingerprint();
    }
    return fingerprintRef.current;
  };

  const submitFeedback = useMutation(api.feedback.submitFeedback);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setErrorMessage("Please enter your feedback");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      await submitFeedback({
        message: message.trim(),
        category,
        fingerprint: getFingerprint(),
      });
      setStatus("success");
      setMessage("");
      
      // Close dialog after success
      setTimeout(() => {
        onClose();
        setStatus("idle");
      }, 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit feedback"
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-muted rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Send Feedback</h2>
              <p className="text-sm text-muted-foreground">Anonymous submission</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {status === "success" ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Thank you!</h3>
            <p className="text-muted-foreground">
              Your feedback has been submitted successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <div className="flex gap-2">
                {[
                  { value: "feature_request", label: "Feature Request" },
                  { value: "bug", label: "Bug Report" },
                  { value: "general", label: "General" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value as FeedbackCategory)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      category === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Feedback
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you think, suggest a feature, or report a bug..."
                className="input w-full h-32 resize-none"
                maxLength={2000}
                disabled={status === "loading"}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  Min 10 characters
                </span>
                <span className="text-xs text-muted-foreground">
                  {message.length}/2000
                </span>
              </div>
            </div>

            {/* Error Message */}
            {status === "error" && errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Privacy Notice */}
            <p className="text-xs text-muted-foreground">
              Your feedback is submitted anonymously. We don&apos;t collect any
              personal information.
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={status === "loading" || message.trim().length < 10}
              className="w-full btn btn-primary"
            >
              {status === "loading" ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Feedback
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// Trigger button component
interface FeedbackButtonProps {
  className?: string;
}

export function FeedbackButton({ className }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className || "btn btn-secondary inline-flex items-center gap-2"}
      >
        <MessageSquare className="w-4 h-4" />
        Send Feedback
      </button>
      <FeedbackDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
