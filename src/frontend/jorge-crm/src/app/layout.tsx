import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jorge Ramirez Group CRM",
  description: "AI-Powered Real Estate CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        {/* Chatwoot live chat widget — bottom-right corner on every page.
            To get the websiteToken:
              1. Log in to Chatwoot at http://localhost:4100
              2. Go to Settings > Inboxes > your Website inbox
              3. Copy the "Website Token" value
              4. Replace YOUR_WEBSITE_TOKEN below
            Or fetch it via the API:
              curl -H "api_access_token: YOUR_ACCESS_TOKEN" \
                http://localhost:4100/auth/sign_in
              curl -H "api_access_token: TOKEN" \
                http://localhost:4100/api/v1/accounts/1/inboxes
              Then grab the website_token from the website inbox object. */}
        <Script
          id="chatwoot-widget"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(d,t) {
                var BASE_URL="http://localhost:4100";
                var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
                g.src=BASE_URL+"/packs/js/sdk.js";
                g.defer = true;
                g.async = true;
                s.parentNode.insertBefore(g,s);
                g.onload=function(){
                  window.chatwootSDK.run({
                    websiteToken: 'YOUR_WEBSITE_TOKEN',
                    baseUrl: BASE_URL
                  })
                }
              })(document,"script");
            `,
          }}
        />
      </body>
    </html>
  );
}
