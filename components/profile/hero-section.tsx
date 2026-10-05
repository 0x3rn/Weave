"use client";

import { User } from "@/types";
import { formatDistanceToNow, format } from "date-fns";
import {
  BadgeCheck,
  MapPin,
  Globe,
  Calendar,
  MessageSquare,
  Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { startDirectConversation } from "@/app/actions/messages";
import toast from "react-hot-toast";

import { usePathname, useRouter } from "next/navigation";

interface HeroSectionProps {
  user: User;
  isOwner: boolean;
  currentUserId?: string | null;
}

export default function HeroSection({
  user,
  isOwner,
  currentUserId,
}: HeroSectionProps) {
  // Compute joined date fallback
  const joinedDate = user.createdAt ? new Date(user.createdAt) : new Date();

  // Safe defaults for stats if backend doesn't populate them yet
  const stats = user.stats || {
    rating: 0,
    exchangesCompleted: 0,
    skillHoursEarned: 0,
    completionRate: 0,
  };

  const router = useRouter();
  const pathname = usePathname();

  const handleActionClick = () => {
    if (!currentUserId) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    // Scroll to calendar if they click Request Exchange
    const calendarElement = document.getElementById("availability-calendar");
    if (calendarElement) {
      calendarElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleMessageClick = async () => {
    if (!currentUserId) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const result = await startDirectConversation(user.uid);
    if (result.success && result.conversationId)
      router.push(`/messages/${result.conversationId}`);
    else toast.error(result.error || "Could not open messages");
  };

  return (
    <div className="space-y-6">
      {/* Profile Info Card */}
      <div className="bg-background border border-border p-6 rounded-[var(--radius-card)] shadow-subtle flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-surface-secondary bg-background flex-shrink-0">
            {user.photoURL ? (
              <Image
                src={user.photoURL || (user as any).photoUrl}
                alt={user.fullName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted bg-surface-secondary">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {user.isVerified && (
            <div className="absolute bottom-1 right-1 bg-surface rounded-full p-0.5 shadow-sm border border-border z-10">
              <BadgeCheck className="w-6 h-6 text-primary fill-primary/10" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-heading flex items-center justify-center gap-2">
          {user.fullName}
        </h1>

        <p className="text-sm font-medium text-primary mt-1">
          {user.headline || user.profession || "Weave Member"}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 text-xs text-muted">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {user.country || "Earth"}
          </div>
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            {user.timeZone || "UTC"}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Joined {format(joinedDate, "MMM yyyy")}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-6 flex flex-col gap-3">
          {isOwner ? (
            <Link
              href="/profile"
              className="w-full py-2.5 bg-surface-secondary hover:bg-border text-heading text-sm font-bold rounded-[var(--radius-button)] transition-colors border border-border"
            >
              Edit Profile
            </Link>
          ) : (
            <>
              <button
                disabled={!user.schedule}
                onClick={handleActionClick}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-surface text-sm font-bold rounded-[var(--radius-button)] transition-colors shadow-subtle"
              >
                Request Exchange
              </button>
              <button
                onClick={handleMessageClick}
                className="w-full py-2.5 bg-surface-secondary hover:bg-border text-heading text-sm font-bold rounded-[var(--radius-button)] transition-colors border border-border flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Send Message
              </button>
            </>
          )}

          {user.publicPrivacy?.allowProfileSharing !== false && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("Profile link copied");
                } catch {
                  toast.error("Could not copy profile link");
                }
              }}
              className="flex items-center justify-center gap-2 rounded-lg border border-border p-2 text-sm"
            >
              <Share2 className="h-4 w-4" />
              Copy profile link
            </button>
          )}
          {user.lastActive && (
            <p className="text-xs text-muted">
              Last active{" "}
              {formatDistanceToNow(new Date(user.lastActive), {
                addSuffix: true,
              })}
            </p>
          )}
          {user.skillHours !== undefined && (
            <p className="text-xs text-muted">
              Skill Hour balance: {user.skillHours}
            </p>
          )}
        </div>
      </div>

      {/* Large Stats Grid */}
      {(isOwner || user.publicPrivacy?.showCompletedExchanges !== false) && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background border border-border p-4 rounded-[var(--radius-card)] flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 mb-1">
                <span className="font-bold text-heading text-lg">
                  {user.publicPrivacy?.showReviews === false
                    ? "Private"
                    : stats.exchangesCompleted > 0
                      ? stats.rating.toFixed(1)
                      : "N/A"}
                </span>
              </div>
              <span className="text-xs text-muted">Rating</span>
            </div>

            <div className="bg-background border border-border p-4 rounded-[var(--radius-card)] flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 mb-1">
                <span className="font-bold text-heading text-lg">
                  {stats.exchangesCompleted}
                </span>
              </div>
              <span className="text-xs text-muted">Exchanges</span>
            </div>

            <div className="bg-background border border-border p-4 rounded-[var(--radius-card)] flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 mb-1">
                <span className="font-bold text-heading text-lg">
                  {stats.skillHoursEarned}
                </span>
              </div>
              <span className="text-xs text-muted">Hours Earned</span>
            </div>

            <div className="bg-background border border-border p-4 rounded-[var(--radius-card)] flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 mb-1">
                <span className="font-bold text-heading text-lg">
                  {stats.exchangesCompleted > 0
                    ? `${stats.completionRate}%`
                    : "N/A"}
                </span>
              </div>
              <span className="text-xs text-muted">Completion Rate</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
