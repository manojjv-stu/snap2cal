import { useRef } from "react";
import { Sparkles, CalendarCheck, MapPin, Clock } from "lucide-react";

type V = React.CSSProperties & { "--ry": string };

export default function Hero3D() {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.MouseEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
    if (ref.current) ref.current.style.transform = `rotateX(${-y * 14}deg) rotateY(${x * 22}deg)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = "rotateX(0deg) rotateY(0deg)"; };

  return (
    <div aria-hidden className="mt-14 flex justify-center">
      <div onMouseMove={move} onMouseLeave={leave} className="origin-top scale-[.72] [perspective:1000px] sm:scale-100">
        <div ref={ref} className="flex h-[260px] w-[470px] items-center justify-center gap-5 transition-transform duration-200 ease-out [transform-style:preserve-3d]">
          <div className="float3d relative h-[190px] w-[135px] shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-rose-400 p-3 text-left text-white shadow-2xl shadow-indigo-500/30" style={{ "--ry": "-16deg" } as V}>
            <div className="text-[9px] tracking-widest opacity-80">LIVE · OCT 15</div>
            <div className="mt-2 text-lg font-bold leading-tight">Tech Innovators Meetup</div>
            <i className="mt-3 block h-1 w-16 rounded bg-white/60" /><i className="mt-1.5 block h-1 w-10 rounded bg-white/40" />
            <div className="absolute bottom-3 left-3 text-[9px]">10:00 AM · RV College</div>
          </div>

          <div className="relative grid h-14 w-14 shrink-0 place-items-center" style={{ transform: "translateZ(70px)" }}>
            <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/30" />
            <span className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-lg"><Sparkles size={20} className="text-indigo-600" /></span>
          </div>

          <div className="float3d w-[210px] shrink-0 overflow-hidden rounded-xl border border-white bg-white text-left shadow-2xl shadow-stone-900/15" style={{ "--ry": "16deg", animationDelay: ".6s" } as V}>
            <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-rose-500 px-3 py-2 text-xs font-medium text-white"><CalendarCheck size={14} />Google Calendar</div>
            <div className="space-y-2 p-3">
              <div className="text-sm font-semibold">Tech Innovators Meetup</div>
              <div className="flex items-center gap-2 text-xs text-stone-600"><Clock size={12} />15 Oct 2026 · 10:00 AM</div>
              <div className="flex items-center gap-2 text-xs text-stone-600"><MapPin size={12} />RV College, Bengaluru</div>
              <div className="rounded-lg bg-stone-900 py-1.5 text-center text-xs text-white">Add to Google Calendar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
