import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─── Props ───────────────────────────────────────────────────────────

export interface LeadVideoProps {
  leadName: string;
  message: string;
  propertyImage: string; // URL or local path
  propertyAddress?: string;
  marketData?: string;
  agentName: string;
  brandColor: string; // hex, e.g. "#1a73e8"
  phoneNumber?: string;
  calendarLink?: string;
}

// ─── Theme ───────────────────────────────────────────────────────────

const COLORS = {
  bg: "#0f1117",
  bgCard: "#181b24",
  textPrimary: "#f0f2f5",
  textSecondary: "#a0a8b8",
  kwRed: "#b40101",
};

// ─── Scene 1 — Animated Intro (0-2s) ────────────────────────────────

const IntroScene: React.FC<{
  brandColor: string;
}> = ({ brandColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const kwOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const kwSlide = interpolate(frame, [20, 35], [30, 0], {
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [10, 40], [0, 60], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${COLORS.bg} 0%, #151820 100%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Accent glow */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${brandColor}22 0%, transparent 70%)`,
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />

      {/* Logo text */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: COLORS.textPrimary,
            fontFamily: "Arial, Helvetica, sans-serif",
            letterSpacing: -1,
            lineHeight: 1.1,
          }}
        >
          Jorge Ramirez
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 300,
            color: brandColor,
            fontFamily: "Arial, Helvetica, sans-serif",
            letterSpacing: 6,
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          Group
        </div>
      </div>

      {/* Divider line */}
      <div
        style={{
          width: `${lineWidth}%`,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)`,
          marginTop: 24,
        }}
      />

      {/* Keller Williams branding */}
      <div
        style={{
          opacity: kwOpacity,
          transform: `translateY(${kwSlide}px)`,
          marginTop: 20,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: COLORS.textSecondary,
            fontFamily: "Arial, Helvetica, sans-serif",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Powered by
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.kwRed,
            fontFamily: "Arial, Helvetica, sans-serif",
            marginTop: 6,
          }}
        >
          Keller Williams
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2 — Personalized Message (2-8s) ──────────────────────────

const MessageScene: React.FC<{
  leadName: string;
  message: string;
  brandColor: string;
}> = ({ leadName, message, brandColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nameOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const nameSlide = interpolate(frame, [0, 15], [-20, 0], {
    extrapolateRight: "clamp",
  });

  const words = message.split(" ");

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Lead name greeting */}
      <div
        style={{
          opacity: nameOpacity,
          transform: `translateY(${nameSlide}px)`,
          fontSize: 40,
          fontWeight: 300,
          color: COLORS.textSecondary,
          fontFamily: "Arial, Helvetica, sans-serif",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Hi{" "}
        <span style={{ color: brandColor, fontWeight: 700 }}>{leadName}</span>,
      </div>

      {/* Message — word-by-word animation */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 10,
          maxWidth: 800,
        }}
      >
        {words.map((word, i) => {
          const wordDelay = 15 + i * 3; // stagger each word
          const opacity = interpolate(
            frame,
            [wordDelay, wordDelay + 8],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const y = interpolate(
            frame,
            [wordDelay, wordDelay + 8],
            [12, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <span
              key={i}
              style={{
                opacity,
                transform: `translateY(${y}px)`,
                fontSize: 32,
                fontWeight: 500,
                color: COLORS.textPrimary,
                fontFamily: "Arial, Helvetica, sans-serif",
                lineHeight: 1.5,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3 — Property Showcase (8-12s) ────────────────────────────

const PropertyScene: React.FC<{
  propertyImage: string;
  propertyAddress: string;
  marketData: string;
  brandColor: string;
}> = ({ propertyImage, propertyAddress, marketData, brandColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgScale = interpolate(frame, [0, 60], [1.1, 1.0], {
    extrapolateRight: "clamp",
  });
  const overlayOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const dataSlide = interpolate(frame, [25, 40], [40, 0], {
    extrapolateRight: "clamp",
  });
  const dataOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* Property image with slow zoom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
        }}
      >
        <img
          src={propertyImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${imgScale})`,
          }}
        />
        {/* Dark gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(15,17,23,0.95) 0%, rgba(15,17,23,0.4) 40%, rgba(15,17,23,0.2) 100%)",
          }}
        />
      </div>

      {/* Address overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 60,
          right: 60,
          opacity: overlayOpacity,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: brandColor,
            fontFamily: "Arial, Helvetica, sans-serif",
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Featured Property
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: COLORS.textPrimary,
            fontFamily: "Arial, Helvetica, sans-serif",
            lineHeight: 1.2,
          }}
        >
          {propertyAddress}
        </div>

        {/* Market data badge */}
        <div
          style={{
            opacity: dataOpacity,
            transform: `translateY(${dataSlide}px)`,
            marginTop: 20,
            display: "inline-block",
            background: COLORS.bgCard,
            border: `1px solid ${brandColor}44`,
            borderRadius: 12,
            padding: "14px 24px",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: COLORS.textSecondary,
              fontFamily: "Arial, Helvetica, sans-serif",
              marginBottom: 4,
            }}
          >
            Market Insight
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: COLORS.textPrimary,
              fontFamily: "Arial, Helvetica, sans-serif",
            }}
          >
            {marketData}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4 — Call-to-Action (12-15s) ──────────────────────────────

const CTAScene: React.FC<{
  agentName: string;
  brandColor: string;
  phoneNumber: string;
  calendarLink: string;
}> = ({ agentName, brandColor, phoneNumber, calendarLink }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6 },
  });
  const headingOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const btnOpacity = interpolate(frame, [15, 28], [0, 1], {
    extrapolateRight: "clamp",
  });
  const btnSlide = interpolate(frame, [15, 28], [30, 0], {
    extrapolateRight: "clamp",
  });

  const contactOpacity = interpolate(frame, [28, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Pulsing glow on CTA button
  const pulseIntensity = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.4, 0.8]
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${COLORS.bg} 0%, #101318 100%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Glow background */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${brandColor}18 0%, transparent 70%)`,
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Heading */}
      <div
        style={{
          opacity: headingOpacity,
          transform: `scale(${headingScale})`,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: COLORS.textSecondary,
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 300,
            marginBottom: 8,
          }}
        >
          Ready to get started?
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: COLORS.textPrimary,
            fontFamily: "Arial, Helvetica, sans-serif",
            lineHeight: 1.2,
          }}
        >
          Book a Call with{" "}
          <span style={{ color: brandColor }}>{agentName}</span>
        </div>
      </div>

      {/* CTA Button */}
      <div
        style={{
          opacity: btnOpacity,
          transform: `translateY(${btnSlide}px)`,
          background: brandColor,
          boxShadow: `0 0 40px ${brandColor}${Math.round(
            pulseIntensity * 255
          )
            .toString(16)
            .padStart(2, "0")}`,
          borderRadius: 16,
          padding: "20px 48px",
          marginBottom: 30,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "Arial, Helvetica, sans-serif",
            textAlign: "center",
          }}
        >
          Schedule Your Free Consultation
        </div>
      </div>

      {/* Contact info */}
      <div
        style={{
          opacity: contactOpacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: COLORS.textPrimary,
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {phoneNumber}
        </div>
        <div
          style={{
            fontSize: 16,
            color: COLORS.textSecondary,
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          {calendarLink}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ────────────────────────────────────────────────

export const LeadVideo: React.FC<LeadVideoProps> = ({
  leadName,
  message,
  propertyImage,
  propertyAddress = "123 Main Street, Austin TX",
  marketData = "Home values up 8% this year",
  agentName,
  brandColor,
  phoneNumber = "(512) 555-0199",
  calendarLink = "calendly.com/jorge-ramirez",
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* Scene 1: Intro — 0s to 2s */}
      <Sequence from={0} durationInFrames={fps * 2}>
        <IntroScene brandColor={brandColor} />
      </Sequence>

      {/* Scene 2: Personalized message — 2s to 8s */}
      <Sequence from={fps * 2} durationInFrames={fps * 6}>
        <MessageScene
          leadName={leadName}
          message={message}
          brandColor={brandColor}
        />
      </Sequence>

      {/* Scene 3: Property showcase — 8s to 12s */}
      <Sequence from={fps * 8} durationInFrames={fps * 4}>
        <PropertyScene
          propertyImage={propertyImage}
          propertyAddress={propertyAddress}
          marketData={marketData}
          brandColor={brandColor}
        />
      </Sequence>

      {/* Scene 4: Call-to-action — 12s to 15s */}
      <Sequence from={fps * 12} durationInFrames={fps * 3}>
        <CTAScene
          agentName={agentName}
          brandColor={brandColor}
          phoneNumber={phoneNumber}
          calendarLink={calendarLink}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
