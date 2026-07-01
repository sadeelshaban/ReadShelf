export function PlatformHeroPreview() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#eadbc8]/80 bg-[#fbf7f0] shadow-[0_24px_60px_rgba(31,22,16,0.14)]"
    >
      <div className="flex items-center gap-2 border-b border-[#eadbc8]/70 bg-white/70 px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-[#d4b896]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#e8dcc8]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#f0e6d8]" />
        <span className="ml-2 text-xs font-medium text-text-muted">ReadShelf Reader</span>
      </div>
      <div className="grid grid-cols-[72px_1fr] gap-0">
        <div className="space-y-2 border-r border-[#eadbc8]/60 bg-white/50 p-3">
          {[1, 2, 3, 4].map((page) => (
            <div
              key={page}
              className={`aspect-[3/4] rounded-md border ${
                page === 2
                  ? "border-primary/40 bg-primary/10 shadow-sm"
                  : "border-[#eadbc8]/70 bg-white/80"
              }`}
            />
          ))}
        </div>
        <div className="space-y-3 p-4">
          <div className="h-3 w-3/4 rounded bg-[#eadbc8]/80" />
          <div className="h-3 w-full rounded bg-[#eadbc8]/55" />
          <div className="relative mt-4 rounded-lg border border-[#eadbc8]/70 bg-white p-4">
            <div className="space-y-2">
              <div className="h-2.5 w-full rounded bg-[#eadbc8]/45" />
              <div className="h-2.5 w-[92%] rounded bg-[#ffe9a8]/90" />
              <div className="h-2.5 w-full rounded bg-[#eadbc8]/45" />
              <div className="h-2.5 w-[80%] rounded bg-[#eadbc8]/45" />
            </div>
            <div className="absolute right-3 top-3 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
              Note
            </div>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-[#7B4B2A] px-2.5 py-1 text-[10px] font-medium text-white">
              Highlight
            </span>
            <span className="rounded-full border border-[#eadbc8] px-2.5 py-1 text-[10px] font-medium text-text-muted">
              Bookmark p.12
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
