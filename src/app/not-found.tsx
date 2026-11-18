import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-grid flex min-h-screen items-center justify-center bg-[#1e1338] px-4 font-sans text-white">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-extrabold">404</h1>
        <p className="mt-4 text-white/80">Esta página não existe.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-5 py-2.5 font-bold"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
