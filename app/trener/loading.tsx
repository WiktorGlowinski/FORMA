export default function CoachLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-pulse">
      {/* Nagłówek i filtry (szkielet) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="flex gap-2 w-full md:w-auto">
          <div className="h-10 w-32 bg-slate-800 rounded-lg" />
          <div className="h-10 w-28 bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Siatka kafelków jednostek treningowych */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-44 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-800 rounded" />
                <div className="h-5 w-16 bg-slate-800 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-slate-800 rounded" />
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-800/60">
              <div className="h-4 w-20 bg-slate-800 rounded" />
              <div className="h-8 w-24 bg-slate-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}