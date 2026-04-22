import Link from "next/link";

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] p-6 md:p-10">
      <div className="max-w-3xl mx-auto border border-[#1F1F1F] bg-[#111111] rounded-xl p-6 md:p-8">
        <h1 className="text-2xl font-semibold">SmartBed Platform</h1>
        <p className="mt-3 text-sm text-[#9CA3AF]">
          Platform workspace is available through role-based dashboards.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-md bg-[#FFC107] text-black px-4 py-2 text-sm font-medium" href="/dashboard">
            Open Dashboard
          </Link>
          <Link className="rounded-md border border-[#1F1F1F] px-4 py-2 text-sm" href="/legacy">
            Open Legacy View
          </Link>
        </div>
      </div>
    </main>
  );
}
