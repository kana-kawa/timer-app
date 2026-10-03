"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlarmIcon, GearIcon, HomeIcon, TimerIcon } from "./Icons";

const NAV = [
  { href: "/", label: "ホーム", Icon: HomeIcon },
  { href: "/pomodoro", label: "ポモドーロ", Icon: TimerIcon },
  { href: "/alarm", label: "アラーム", Icon: AlarmIcon },
  { href: "/settings", label: "設定", Icon: GearIcon },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();

  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <TimerIcon className="size-5 text-work" />
            作業タイマー
          </Link>
          {/* PC: ヘッダー内にナビ */}
          <nav className="hidden gap-1 sm:flex" aria-label="メインメニュー">
            {NAV.slice(1).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive(pathname, href)
                    ? "bg-surface-muted font-medium text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* スマホ: 画面下部のタブバー */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
        aria-label="メインメニュー"
      >
        <ul className="grid grid-cols-4">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                    active ? "text-foreground" : "text-muted"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-6" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
