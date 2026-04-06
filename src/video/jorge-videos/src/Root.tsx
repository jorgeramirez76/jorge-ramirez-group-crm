import React from "react";
import { Composition } from "remotion";
import { LeadVideo, LeadVideoProps } from "./LeadVideo";

const FPS = 30;
const DURATION_SECONDS = 15;

const defaultProps: LeadVideoProps = {
  leadName: "Sarah",
  message:
    "I noticed your home on Maple Drive and wanted to share some exciting market insights. Your neighborhood has seen incredible growth this year and I would love to show you what your home could be worth.",
  propertyImage:
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
  propertyAddress: "4521 Maple Drive, Austin TX 78745",
  marketData: "Home values up 12% in 78745 this quarter",
  agentName: "Jorge",
  brandColor: "#1a73e8",
  phoneNumber: "(512) 555-0199",
  calendarLink: "calendly.com/jorge-ramirez",
};

// Use any-typed Composition to avoid Zod schema requirement in Remotion v4
const C = Composition as React.FC<Record<string, unknown>>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Vertical format — mobile / social (1080x1920) */}
      <C
        id="LeadVideoVertical"
        component={LeadVideo}
        durationInFrames={FPS * DURATION_SECONDS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />

      {/* Horizontal format — desktop / YouTube (1920x1080) */}
      <C
        id="LeadVideoHorizontal"
        component={LeadVideo}
        durationInFrames={FPS * DURATION_SECONDS}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
    </>
  );
};
