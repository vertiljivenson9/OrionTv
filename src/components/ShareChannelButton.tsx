"use client";

import { useState } from "react";
import { Share2, Check, Link } from "lucide-react";

interface ShareChannelButtonProps {
  channelName: string;
  channelId?: string;
  compact?: boolean;
}

export default function ShareChannelButton({
  channelName,
  channelId,
  compact = false,
}: ShareChannelButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = channelId
      ? `https://orion-tv-indol.vercel.app/?channel=${channelId}`
      : 'https://orion-tv-indol.vercel.app/';

    try {
      // Try native share first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: `${channelName} - OrionTV`,
          text: `Mira ${channelName} en vivo en OrionTV`,
          url: shareUrl,
        });
        return;
      }

      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // User cancelled or error
      console.log('Share cancelled or failed');
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleShare}
        className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
        title="Compartir canal"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Link className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-medium"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          <span>¡Copiado!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Compartir
        </>
      )}
    </button>
  );
}
