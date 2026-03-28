export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full flex-col items-center justify-center p-24">
        <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome to LegalEdge
        </h1>
        <a
          href="/auth-test"
          className="mt-6 rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Open Auth Test Page
        </a>
      </main>
    </div>
  );
}
