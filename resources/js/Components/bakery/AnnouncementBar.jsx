import React from 'react';
import { useSiteSettings } from '@/lib/site-settings';

export default function AnnouncementBar() {
  const { data: settings } = useSiteSettings();
  if (!settings?.announcement_bar_enabled || !settings?.announcement_bar_text) return null;

  return (
    <div
      className="bg-foreground text-background py-2.5 text-center px-4"
      style={{
        backgroundColor: settings?.announcement_bar_color || undefined,
        color: settings?.announcement_bar_text_color || undefined,
      }}
    >
      <p className="font-label text-xs md:text-sm">{settings.announcement_bar_text}</p>
    </div>
  );
}