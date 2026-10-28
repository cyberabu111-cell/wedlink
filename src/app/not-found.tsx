import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-[#FAF8F5] text-slate-800">
      <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2">Invitation Not Found</h1>
      <p className="text-sm text-slate-600 mb-6 max-w-sm">
        The wedding invitation link you followed does not exist or may have been updated.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-xs font-semibold hover:bg-slate-800 transition-colors"
      >
        Return to Home
      </Link>
    </main>
  );
}
