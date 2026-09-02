import Link from "next/link";

export function LinkVoltar({ href, texto }: { href: string; texto: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-ink-400 text-sm hover:text-ink-100 hover:bg-base-800 transition rounded-lg pl-1.5 pr-2.5 py-1 -ml-1.5"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M15 18L9 12L15 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {texto}
    </Link>
  );
}
