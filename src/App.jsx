import React, { useState } from "react";
import {
  BookOpen,
  LayoutGrid,
  Users2,
  Webhook as WebhookIcon,
  Settings,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import StatCards from "./components/StatCards";
import RealTimeChart from "./components/RealTimeChart";
import MerchantTable from "./components/MerchantTable";
import RegisterMerchantForm from "./components/RegisterMerchantForm";
import WebhookSimulator from "./components/WebhookSimulator";

const NAV_ITEMS = [
  { key: "overview", icon: LayoutGrid, label: "Overview" },
  { key: "merchants", icon: Users2, label: "Merchants" },
  { key: "webhooks", icon: WebhookIcon, label: "Webhooks" },
  { key: "settings", icon: Settings, label: "Settings" },
];

/**
 * The Ledger Spine — the signature element of this interface. A narrow
 * vertical rail styled as the binding of a physical ledger book: a single
 * gold hairline running its full height, with navigation glyphs stacked
 * along it. Every other surface in the app stays flat and quiet so this
 * remains the one unmistakable device.
 */
function LedgerSpine({ activeSection, onNavigate }) {
  return (
    <nav
      aria-label="Primary navigation"
      className="hidden sm:flex flex-col items-center w-14 shrink-0 bg-seb-ledger ledger-spine-glow border-r ledger-divider py-5"
    >
      <div className="mb-8" title="The Sovereign Ecosystem Blueprint">
        <BookOpen size={18} strokeWidth={1.5} className="text-seb-gold" />
      </div>

      <ul className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.key;
          return (
            <li key={item.key}>
              <button
                onClick={() => onNavigate(item.key)}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center justify-center w-9 h-9 transition-colors ${
                  isActive
                    ? "text-seb-gold bg-seb-goldfaint"
                    : "text-seb-mist hover:text-seb-platinum hover:bg-seb-ledgerlight"
                }`}
              >
                {isActive && (
                  <span className="absolute -left-[1px] top-1.5 bottom-1.5 w-[2px] bg-seb-gold" />
                )}
                <item.icon size={16} strokeWidth={1.75} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto" title="Sovereign-grade audit trail">
        <ShieldCheck size={16} strokeWidth={1.5} className="text-seb-mist" />
      </div>
    </nav>
  );
}

function Header({ onOpenRegister }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 px-5 sm:px-8 py-6 border-b ledger-divider">
      <div>
        <div className="flex items-baseline gap-2.5">
          <h1 className="font-display text-2xl sm:text-[1.7rem] text-seb-gold tracking-tight">SEB</h1>
          <span className="text-seb-mist text-sm">·</span>
          <p className="text-sm sm:text-[0.95rem] text-seb-platinum">
            The Pan-East African Informal Sector Economic Ledger
          </p>
        </div>
        <p className="mt-1 text-[11px] font-mono text-seb-mist tracking-wide">
          The Sovereign Ecosystem Blueprint — Letema Group Digital Infrastructure
        </p>
      </div>

      <button
        onClick={onOpenRegister}
        className="inline-flex items-center gap-2 self-start sm:self-auto bg-seb-gold text-seb-obsidian px-4 py-2.5 text-xs font-mono tracking-wide font-medium hover:bg-seb-gold/90 transition-colors"
      >
        <UserPlus size={14} />
        Register Merchant
      </button>
    </header>
  );
}

function Footer() {
  return (
    <footer className="px-5 sm:px-8 py-4 text-[11px] font-mono text-seb-mist flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
      <span>SEB-Ledger v1.0.0 · Connected to Express/Supabase backend core</span>
      <span>© {new Date().getFullYear()} Letema Group · Dodoma &amp; Mbeya, Tanzania</span>
    </footer>
  );
}

function SettingsPanel() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
  return (
    <div className="px-5 sm:px-8 py-6 max-w-2xl">
      <h2 className="font-display text-lg text-seb-platinum mb-1">Connection</h2>
      <p className="text-xs text-seb-mist mb-6">
        This dashboard talks to the seb-ledger-core backend over the API base URL below.
        Change it via the <span className="font-mono">VITE_API_BASE_URL</span> environment variable.
      </p>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between border-b ledger-divider pb-2">
          <dt className="text-seb-mist">API base URL</dt>
          <dd className="font-mono text-seb-platinum">{apiBase}</dd>
        </div>
        <div className="flex justify-between border-b ledger-divider pb-2">
          <dt className="text-seb-mist">Frontend version</dt>
          <dd className="font-mono text-seb-platinum">1.0.0</dd>
        </div>
        <div className="flex justify-between border-b ledger-divider pb-2">
          <dt className="text-seb-mist">Backend</dt>
          <dd className="font-mono text-seb-platinum">seb-ledger-core</dd>
        </div>
      </dl>
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState("overview");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  // Bumped to force MerchantTable (and anything else watching this) to
  // refetch immediately after a successful registration, rather than
  // waiting for its next poll interval.
  const [merchantRefreshToken, setMerchantRefreshToken] = useState(0);

  return (
    <div className="min-h-screen flex bg-seb-obsidian text-seb-platinum">
      <LedgerSpine activeSection={activeSection} onNavigate={setActiveSection} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenRegister={() => setIsRegisterOpen(true)} />

        <main className="flex-1">
          {activeSection === "overview" && (
            <>
              <StatCards />
              <RealTimeChart />
            </>
          )}

          {activeSection === "merchants" && (
            <MerchantTable refreshToken={merchantRefreshToken} />
          )}

          {activeSection === "webhooks" && <WebhookSimulator />}

          {activeSection === "settings" && <SettingsPanel />}
        </main>

        <Footer />
      </div>

      <RegisterMerchantForm
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegistered={() => {
          // Bump the token so MerchantTable refetches immediately instead
          // of waiting for its next poll cycle, and jump the user to the
          // Merchants tab so they can see the new row land.
          setMerchantRefreshToken((t) => t + 1);
          setActiveSection("merchants");
        }}
      />
    </div>
  );
}
