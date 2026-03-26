"use client";

type MobileStickyCTAProps = {
  onJoinWaitlist: () => void;
  onInstallClick: () => void;
};

export function MobileStickyCTA({ onJoinWaitlist, onInstallClick }: MobileStickyCTAProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/94 px-4 py-3 shadow-[0_-10px_35px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl gap-3">
        <button type="button" className="button-secondary !min-h-11 flex-1 px-4 py-2.5" onClick={onInstallClick}>
          Platform
        </button>
        <button type="button" className="button-accent !min-h-11 flex-1 px-4 py-2.5" onClick={onJoinWaitlist}>
          Book demo
        </button>
      </div>
    </div>
  );
}
