"use client";
import Image from "next/image";
import { FormattedMessage, useIntl } from 'react-intl';

export default function Home() {
  const intl = useIntl();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-16 font-sans relative overflow-hidden">
      {/* Blurred Gradient Background */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 20% 40%, #64b4ff 0%, transparent 60%)," +
            "radial-gradient(circle at 80% 60%, #ff7ce5 0%, transparent 60%)," +
            "radial-gradient(circle at 50% 80%, #ffd36e 0%, transparent 70%)",
          filter: "blur(64px)",
          opacity: 0.55,
        }}
      />
      <Image
        src="/assets/Webrush.png"
        alt="Webrush Studio Logo"
        width={120}
        height={120}
        className="mb-2"
        priority
      />
      <h1 className="text-3xl sm:text-4xl font-bold text-center leading-tight">
        <FormattedMessage id="welcome" defaultMessage="Welcome to the Webrush Client Portal" />
      </h1>
      <p className="text-lg text-muted-foreground text-center max-w-md">
        This is your secure space to view and manage your invoices, powered by Webrush Studio. If you received a direct invoice link, you can view its details here. For any questions or support, please reach out to our team.
      </p>
      <a
        href="mailto:support@webrush.studio"
        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors text-base text-center"
      >
        support@webrush.studio
      </a>
      <a
        href="https://webrush.studio"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition-colors"
      >
        Visit Webrush Studio
      </a>
    </div>
  );
}
