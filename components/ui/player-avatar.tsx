"use client";

import { useState } from "react";

interface PlayerAvatarProps {
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PlayerAvatar({
  avatarUrl,
  firstName,
  lastName,
  jerseyNumber,
  size = "md",
  className = "",
}: PlayerAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs rounded-xl",
    md: "w-11 h-11 text-sm rounded-2xl",
    lg: "w-16 h-16 text-base rounded-2xl",
    xl: "w-24 h-24 text-xl rounded-3xl",
  }[size];

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  if (avatarUrl && !hasError) {
    return (
      <div
        className={`relative ${sizeClasses} overflow-hidden border border-stone-200/90 shadow-sm shrink-0 bg-stone-100 ${className}`}
      >
        <img
          src={avatarUrl}
          alt={`${firstName} ${lastName}`}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} bg-[#133E2B]/10 border border-[#133E2B]/20 text-[#133E2B] font-black flex items-center justify-center shrink-0 tracking-tight shadow-inner ${className}`}
      title={`${firstName} ${lastName}`}
    >
      {jerseyNumber ? `#${jerseyNumber}` : initials}
    </div>
  );
}