import { useState, useEffect } from "react";
import { getMakes, getModelsFromMake, getColors, getFuels, getCarTypes } from "./data/make_model";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Check, ChevronsUpDown, Car, Gauge, Fuel, Palette,
  Settings2, Zap, BadgeCheck, Sparkles, TrendingUp, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
// const API = "http://localhost:8000";
// const API = "https://automarketpriceanalysis.onrender.com";
const API = "https://mahadimunna22-dl-seg-class-ai.hf.space"

const TRANSMISSIONS = ["Manual", "Automatic"];

const DEFAULT_FORM = {
  makeName: "", modelName: "", mileage: "", first_reg_year: "",
  fuel_code: "", transmission: "", car_type: "", color_code: "",
  isPremium: false,
};

// ─────────────────────────────────────────────
// Combobox
// ─────────────────────────────────────────────
function Combobox({ value, onChange, options, placeholder, disabled = false }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (lowercasedVal) => {
    const original = options.find((o) => o.toString().toLowerCase() === lowercasedVal) ?? lowercasedVal;
    onChange(original === value ? "" : original);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between font-normal bg-white hover:bg-slate-50 border-slate-200 h-10"
        >
          <span className={cn("truncate", !value ? "text-slate-400" : "text-slate-800")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-lg border-slate-200" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder?.toLowerCase()}…`} className="h-9" />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="max-h-56 overflow-y-auto">
            {options.map((opt) => (
              <CommandItem key={opt} value={opt} onSelect={handleSelect} className="cursor-pointer">
                <Check className={cn("mr-2 h-4 w-4 text-blue-600", value === opt ? "opacity-100" : "opacity-0")} />
                {opt}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────
// Field
// ─────────────────────────────────────────────
function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────
function Section({ title, children, className = "" }) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Toggle
// ─────────────────────────────────────────────
function Toggle({ label, description, icon: Icon, checked, onCheckedChange }) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 p-2 pe-4 text-left transition-all duration-150 w-full",
        checked
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
        checked ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", checked ? "text-blue-700" : "text-slate-700")}>{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-blue-500" : "bg-slate-200"
      )}>
        <span className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
export default function App() {
  const [form, setForm]       = useState(DEFAULT_FORM);
  const [models, setModels]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");

  const [makes] = useState(() =>
    getMakes().map((m) => (typeof m === "string" ? m : m.makeName ?? m.name ?? String(m)))
  );
  const [colors] = useState(() =>
    getColors().map((c) => (typeof c === "string" ? c : c.color ?? c.name ?? String(c)))
  );
  const [fuels] = useState(() =>
    getFuels().map((f) => (typeof f === "string" ? f : f.fuel ?? f.name ?? String(f)))
  );
  const [carTypes] = useState(() =>
    getCarTypes().map((t) => (typeof t === "string" ? t : t.car_type ?? t.name ?? String(t)))
  );

  useEffect(() => {
    if (form.makeName) {
      const raw = getModelsFromMake(form.makeName) ?? [];
      setModels(raw.map((m) => (typeof m === "string" ? m : m.modelName ?? m.name ?? String(m))));
      setForm((prev) => ({ ...prev, modelName: "" }));
    } else {
      setModels([]);
    }
  }, [form.makeName]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleReset = () => { setForm(DEFAULT_FORM); setResult(null); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const payload = {
      makeName:     form.makeName,
      modelName:    form.modelName,
      mileage:      Number(form.mileage),
      color_code:   form.color_code,
      fuel_code:    form.fuel_code,
      transmission: form.transmission,
      car_type:     form.car_type,
      isPremium:    form.isPremium,
      first_reg_year: Number(form.first_reg_year),
    };

    if (!payload.makeName || !payload.modelName || isNaN(payload.mileage) || !payload.color_code || !payload.fuel_code || !payload.transmission || !payload.car_type || isNaN(payload.first_reg_year)) {
      setError("Please fill in all required fields with valid values.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/mkg-price-analysis/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setResult(data.predicted_price);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-10 pb-48 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            <Sparkles className="h-3 w-3 text-yellow-400" />
            AI-powered valuation
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            What's Your Car Worth?
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            Fill in the details below and get an instant market price estimate.
          </p>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="mx-auto max-w-2xl px-4 pb-16 -mt-40">
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden py-0">
          <CardContent className="p-6 sm:p-8 space-y-7">
            <form onSubmit={handleSubmit} className="space-y-7">

              {/* Vehicle identity */}
              <Section title="Vehicle" className="mt-0">
                <Field label="Brand" icon={Car}>
                  <Combobox value={form.makeName} onChange={(v) => set("makeName", v)}
                    options={makes} placeholder="Select brand" />
                </Field>
                <Field label="Model" icon={Car}>
                  <Combobox value={form.modelName} onChange={(v) => set("modelName", v)}
                    options={models}
                    placeholder={form.makeName ? "Select model" : "Select brand first"}
                    disabled={!form.makeName} />
                </Field>
                <Field label="Car Type" icon={Settings2}>
                  <Combobox value={form.car_type} onChange={(v) => set("car_type", v)}
                    options={carTypes} placeholder="Select car type" />
                </Field>
                <Field label="Transmission" icon={Settings2}>
                  <Combobox value={form.transmission} onChange={(v) => set("transmission", v)}
                    options={TRANSMISSIONS} placeholder="Select transmission" />
                </Field>
              </Section>

              {/* Specs */}
              <Section title="Specifications">
                <Field label="Fuel Type" icon={Fuel}>
                  <Combobox value={form.fuel_code} onChange={(v) => set("fuel_code", v)}
                    options={fuels} placeholder="Select fuel type" />
                </Field>
                <Field label="Color" icon={Palette}>
                  <Combobox value={form.color_code} onChange={(v) => set("color_code", v)}
                    options={colors} placeholder="Select color" />
                </Field>
                <Field label="Mileage (km)" icon={Gauge}>
                  <Input type="number" placeholder="e.g. 50 000" min={0}
                    className="bg-white border-slate-200 h-10"
                    value={form.mileage} onChange={(e) => set("mileage", e.target.value)} />
                </Field>
                <Field label="Car's Age (years)" icon={Zap}>
                  <Input type="number" placeholder="e.g. 5" min={0}
                    className="bg-white border-slate-200 h-10"
                    value={form.first_reg_year} onChange={(e) => set("first_reg_year", e.target.value)} />
                </Field>
              </Section>

              {/* Toggles */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">
                  Additional Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Toggle
                    label="Premium Segment"
                    description="Luxury / high-end trim"
                    icon={Sparkles}
                    checked={form.isPremium}
                    onCheckedChange={(v) => set("isPremium", v)}
                  />
                  <div className="flex gap-3">
                    <Button type="submit" size="lg" disabled={loading}
                      className="flex-1 bg-slate-900 hover:bg-slate-700 text-white font-semibold tracking-wide h-auto min-h-10">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Analysing…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Estimate Price
                        </span>
                      )}
                    </Button>
                    {result !== null && <Button
                      type="button" variant="outline" size="lg"
                      onClick={handleReset}
                      className="border-slate-200 text-slate-500 hover:text-slate-700 h-auto min-h-10 w-14"
                    >
                      <RotateCcw className="h-8 w-8" />
                    </Button>}
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

            </form>

            {/* Result */}
            {result !== null && (
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-center space-y-2 shadow-lg">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  Estimated Market Value
                </div>
                <p className="text-5xl font-extrabold text-white tracking-tight">
                  {typeof result === "number"
                    ? `CHF ${result.toLocaleString("en-US", { minimumFractionDigits: 0 })}`
                    : JSON.stringify(result)}
                </p>
                <p className="text-xs text-slate-400">
                  Based on current Swiss market data
                </p>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}