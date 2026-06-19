import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, X, CheckCircle2, Clock } from "lucide-react";

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Mon" }, { key: "tue", label: "Tue" }, { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" }, { key: "fri", label: "Fri" }, { key: "sat", label: "Sat" }, { key: "sun", label: "Sun" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7; // Mon = 0
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function AvailabilityTab() {
  const qc = useQueryClient();
  const today = new Date();

  const { data: settings = [] } = useQuery({
    queryKey: ["site-settings-all"],
    queryFn: async () => (await supabase.from("site_settings").select("*")).data ?? [],
  });
  const { data: blocks = [] } = useQuery({
    queryKey: ["availability-blocks"],
    queryFn: async () => (await supabase.from("availability_blocks").select("*").order("block_date")).data ?? [],
  });

  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value;
  const [workingDays, setWorkingDays] = useState<Record<string, boolean>>({});
  const [defaultSlots, setDefaultSlots] = useState<Record<string, string[]>>({});
  const [newSlot, setNewSlot] = useState<Record<string, string>>({});

  useEffect(() => {
    try { setWorkingDays(JSON.parse(getSetting("working_days") ?? "{}")); } catch { }
    try { setDefaultSlots(JSON.parse(getSetting("default_slots") ?? "{}")); } catch { }
  }, [settings]);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayNote, setDayNote] = useState("");
  const [dayAvail, setDayAvail] = useState(true);
  const [daySlots, setDaySlots] = useState<string[]>([]);
  const [newDaySlot, setNewDaySlot] = useState("");
  const [saving, setSaving] = useState(false);

  const blocksMap = Object.fromEntries(blocks.map((b: any) => [b.block_date, b]));

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const selectDay = (iso: string) => {
    setSelectedDate(iso);
    const block = blocksMap[iso];
    if (block) {
      setDayAvail(block.is_available);
      setDayNote(block.note ?? "");
      try { setDaySlots(JSON.parse(block.slots ?? "[]")); } catch { setDaySlots([]); }
    } else {
      // Use weekly default
      const d = new Date(iso);
      const dayKey = DAYS[(d.getDay() + 6) % 7].key;
      setDayAvail(workingDays[dayKey] ?? false);
      setDayNote("");
      setDaySlots(defaultSlots[dayKey] ?? []);
    }
  };

  const saveDay = async () => {
    if (!selectedDate) return;
    setSaving(true);
    const payload = {
      block_date: selectedDate,
      is_available: dayAvail,
      note: dayNote,
      slots: JSON.stringify(daySlots),
    };
    const existing = blocksMap[selectedDate];
    if (existing) {
      await supabase.from("availability_blocks").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("availability_blocks").insert(payload as any);
    }
    qc.invalidateQueries({ queryKey: ["availability-blocks"] });
    toast.success(`${selectedDate} saved`);
    setSaving(false);
  };

  const deleteDay = async () => {
    if (!selectedDate) return;
    const existing = blocksMap[selectedDate];
    if (existing) {
      await supabase.from("availability_blocks").delete().eq("id", existing.id);
      qc.invalidateQueries({ queryKey: ["availability-blocks"] });
      toast.success("Override removed — back to weekly default");
    }
    setSelectedDate(null);
  };

  const saveSetting = async (key: string, value: any) => {
    const json = JSON.stringify(value);
    const existing = settings.find((s: any) => s.key === key);
    if (existing) await supabase.from("site_settings").update({ value: json }).eq("key", key);
    else await supabase.from("site_settings").insert({ key, value: json } as any);
  };

  const saveWeekly = async () => {
    await saveSetting("working_days", workingDays);
    await saveSetting("default_slots", defaultSlots);
    qc.invalidateQueries({ queryKey: ["site-settings-all"] });
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    toast.success("Weekly schedule saved");
  };

  const applyToNext60 = async () => {
    if (!confirm("Apply weekly schedule to the next 60 days? Existing manual overrides are kept.")) return;
    const existingDates = new Set(blocks.map((b: any) => b.block_date));
    const inserts: any[] = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      if (existingDates.has(iso)) continue;
      const dayKey = DAYS[(d.getDay() + 6) % 7].key;
      const isAvail = workingDays[dayKey] ?? false;
      inserts.push({ block_date: iso, is_available: isAvail, note: isAvail ? "weekly schedule" : "off day", slots: JSON.stringify(defaultSlots[dayKey] ?? []) });
    }
    if (inserts.length === 0) return toast.info("All next 60 days already set");
    const { error } = await supabase.from("availability_blocks").insert(inserts);
    if (error) toast.error(error.message);
    else { toast.success(`Applied to ${inserts.length} day(s)`); qc.invalidateQueries({ queryKey: ["availability-blocks"] }); }
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const todayISO = today.toISOString().slice(0, 10);

  const getDayStatus = (iso: string) => {
    const block = blocksMap[iso];
    if (block) return block.is_available ? "available" : "blocked";
    const d = new Date(iso);
    const dayKey = DAYS[(d.getDay() + 6) % 7].key;
    return workingDays[dayKey] ? "default-available" : "default-blocked";
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Full Calendar */}
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Availability Calendar</h2>
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="w-8 h-8 rounded-full border border-border bg-secondary/60 grid place-items-center hover:border-primary transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="font-semibold text-sm min-w-[140px] text-center">{MONTH_NAMES[calMonth]} {calYear}</span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-full border border-border bg-secondary/60 grid place-items-center hover:border-primary transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary/70" />Available (override)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-destructive/70" />Blocked (override)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/30" />Available (weekly default)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-secondary" />Off (weekly default)</span>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const iso = toISO(calYear, calMonth, day);
            const status = getDayStatus(iso);
            const isToday = iso === todayISO;
            const isSelected = iso === selectedDate;
            const isPast = iso < todayISO;

            const bgClass = isPast ? "opacity-40 cursor-not-allowed" :
              status === "available" ? "bg-primary/70 hover:bg-primary text-white cursor-pointer" :
              status === "blocked" ? "bg-destructive/70 hover:bg-destructive text-white cursor-pointer" :
              status === "default-available" ? "bg-primary/20 border border-primary/30 hover:bg-primary/40 cursor-pointer" :
              "bg-secondary/50 hover:bg-secondary cursor-pointer";

            return (
              <button key={iso} disabled={isPast}
                onClick={() => !isPast && selectDay(iso)}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all
                  ${bgClass}
                  ${isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-background scale-105" : ""}
                  ${isToday ? "font-bold" : ""}
                `}>
                {day}
                {isToday && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-current" />}
                {blocksMap[iso] && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/60" />}
              </button>
            );
          })}
        </div>

        {/* Day editor */}
        {selectedDate && (
          <div className="mt-6 border-t border-border pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">{selectedDate}</h3>
              <button onClick={() => setSelectedDate(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-2">Availability</div>
                <div className="flex gap-2">
                  <button onClick={() => setDayAvail(true)}
                    className={`flex-1 py-2 rounded-md text-xs font-semibold border transition-colors ${dayAvail ? "bg-primary text-primary-foreground border-primary" : "border-border bg-secondary/40 text-muted-foreground"}`}>
                    ✓ Available
                  </button>
                  <button onClick={() => setDayAvail(false)}
                    className={`flex-1 py-2 rounded-md text-xs font-semibold border transition-colors ${!dayAvail ? "bg-destructive text-white border-destructive" : "border-border bg-secondary/40 text-muted-foreground"}`}>
                    ✗ Blocked
                  </button>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Note (optional)</div>
                <input value={dayNote} onChange={e => setDayNote(e.target.value)} placeholder="e.g. Fully booked, Personal day..."
                  className="w-full bg-input border border-border rounded px-3 py-2 text-xs" />
              </div>
            </div>

            {dayAvail && (
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Clock size={11} /> Time slots</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {daySlots.map(t => (
                    <span key={t} className="flex items-center gap-1 bg-secondary/60 border border-border rounded-full px-3 py-1 text-xs">
                      {t}
                      <button onClick={() => setDaySlots(s => s.filter(x => x !== t))} className="text-muted-foreground hover:text-destructive ml-1"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="time" value={newDaySlot} onChange={e => setNewDaySlot(e.target.value)}
                    className="bg-input border border-border rounded px-2 py-1.5 text-xs" />
                  <button onClick={() => { if (newDaySlot) { setDaySlots(s => Array.from(new Set([...s, newDaySlot])).sort()); setNewDaySlot(""); } }}
                    className="btn-lime px-3 py-1.5 rounded text-xs flex items-center gap-1"><Plus size={11} /> Add slot</button>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button onClick={saveDay} disabled={saving} className="btn-lime px-4 py-2 rounded-md text-xs font-semibold disabled:opacity-50">
                {saving ? "Saving..." : "Save this day"}
              </button>
              {blocksMap[selectedDate] && (
                <button onClick={deleteDay} className="btn-ghost-dark px-4 py-2 rounded-md text-xs border border-destructive/40 text-destructive hover:bg-destructive/10">
                  Remove override
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Default Schedule */}
      <div className="panel p-6">
        <h2 className="font-display text-xl font-bold mb-1">Weekly Default Schedule</h2>
        <p className="text-sm text-muted-foreground mb-5">This is your base schedule. Use the calendar above to override specific dates.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {DAYS.map(d => {
            const on = !!workingDays[d.key];
            return (
              <div key={d.key} className={`rounded-lg border p-3 ${on ? "border-primary/50 bg-primary/5" : "border-border bg-secondary/30"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{d.label}</span>
                  <button onClick={() => setWorkingDays(w => ({ ...w, [d.key]: !w[d.key] }))}
                    className={`w-9 h-5 rounded-full relative transition-colors ${on ? "bg-primary" : "bg-secondary border border-border"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {on && (
                  <div className="space-y-1.5 mt-2">
                    {(defaultSlots[d.key] ?? []).map(t => (
                      <div key={t} className="flex items-center justify-between text-xs bg-background/50 rounded px-2 py-1">
                        <span>{t}</span>
                        <button onClick={() => setDefaultSlots(s => ({ ...s, [d.key]: (s[d.key] ?? []).filter(x => x !== t) }))}
                          className="text-muted-foreground hover:text-destructive"><X size={11} /></button>
                      </div>
                    ))}
                    <div className="flex gap-1 mt-1">
                      <input type="time" value={newSlot[d.key] ?? ""} onChange={e => setNewSlot(n => ({ ...n, [d.key]: e.target.value }))}
                        className="flex-1 min-w-0 text-xs bg-input border border-border rounded px-1.5 py-1" />
                      <button onClick={() => { const t = newSlot[d.key]; if (!t) return; setDefaultSlots(s => ({ ...s, [d.key]: Array.from(new Set([...(s[d.key] ?? []), t])).sort() })); setNewSlot(n => ({ ...n, [d.key]: "" })); }}
                        className="text-primary"><Plus size={12} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={saveWeekly} className="btn-lime px-4 py-2 rounded-md text-xs font-semibold">Save weekly schedule</button>
          <button onClick={applyToNext60} className="btn-ghost-dark px-4 py-2 rounded-md text-xs">Apply to next 60 days</button>
        </div>
      </div>
    </div>
  );
}