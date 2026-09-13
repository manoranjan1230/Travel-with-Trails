import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Headphones, Heart, Leaf, Pencil, Search, Send, Share2, ShieldCheck, Star, Users, X, CalendarDays, Sparkles, SlidersHorizontal, Mountain, Ticket } from 'lucide-react';
import { trips, alpineHero, spitiValley, kedarnath, valleyFlowers } from '@/data/trips';
import type { Trip, Traveller, Booking } from '@/types/models';
import { PageShell, SearchBox, SectionTitle, TripCard, TrustRow, Filters, Metric, ItineraryPreview, InfoList, BookingStepper, Field, EmptyState } from '@/components/common';
import { readTravellerStorage, TRAVELLERS_KEY } from '@/services/storage';

const emptyTraveller = (): Traveller => ({ id: `traveller-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', dob: '', gender: '', mobile: '', email: '', emergencyName: '', emergencyPhone: '', relationship: '', medical: '' });

export function TravellerForm({ initial, onCancel, onDone }: { initial?: Traveller; onCancel: () => void; onDone: (traveller: Traveller) => void }) {
  const [form, setForm] = useState<Traveller>(initial ?? emptyTraveller());
  const [error, setError] = useState('');
  const update = (key: keyof Traveller, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const required = ['name', 'dob', 'gender', 'mobile', 'emergencyName', 'emergencyPhone', 'relationship'] as const;
  const save = () => {
    if (required.some((key) => !form[key].trim())) {
      setError('Please fill all required fields before continuing.');
      return;
    }
    onDone(form);
  };
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#10271f]/55 p-4 backdrop-blur-md" role="dialog" aria-modal="true" data-testid="add-traveller-dialog">
    <div className="max-h-[94dvh] w-full max-w-[720px] overflow-y-auto rounded-[26px] border border-border bg-background p-5 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-primary">Traveller details</p><h2 className="mt-2 font-display text-[29px]">{initial ? 'Edit Traveller' : 'Add New Traveller'}</h2><p className="mt-1 text-[11px] text-muted-foreground">Fill in the details below to add a traveller to this booking.</p></div><button type="button" onClick={onCancel} className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border" aria-label="Close"><X size={16}/></button></div>
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl bg-secondary/55 p-4 sm:p-5"><h3 className="text-[13px] font-bold">Personal Details</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Full Name" required value={form.name} onChange={(v)=>update('name',v)} placeholder="Enter full name" className="sm:col-span-2"/><Field label="Date of Birth" required type="date" value={form.dob} onChange={(v)=>update('dob',v)} /><div><label className="text-[10px] font-bold">Gender <span className="text-[#c35b4e]">*</span></label><div className="mt-2 flex gap-4 text-[11px]"><label className="flex items-center gap-2"><input type="radio" name="gender" checked={form.gender==='Male'} onChange={()=>update('gender','Male')}/>Male</label><label className="flex items-center gap-2"><input type="radio" name="gender" checked={form.gender==='Female'} onChange={()=>update('gender','Female')}/>Female</label><label className="flex items-center gap-2"><input type="radio" name="gender" checked={form.gender==='Other'} onChange={()=>update('gender','Other')}/>Other</label></div></div></div></div>
        <div className="rounded-2xl bg-secondary/55 p-4 sm:p-5"><h3 className="text-[13px] font-bold">Contact Details</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Mobile Number" required value={form.mobile} onChange={(v)=>update('mobile',v)} placeholder="Enter mobile number" inputMode="tel"/><Field label="Email Address" value={form.email} onChange={(v)=>update('email',v)} placeholder="Enter email address" type="email"/></div></div>
        <div className="rounded-2xl bg-secondary/55 p-4 sm:p-5"><h3 className="text-[13px] font-bold">Emergency Contact</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Emergency Contact Name" required value={form.emergencyName} onChange={(v)=>update('emergencyName',v)} placeholder="Enter contact name"/><Field label="Emergency Contact Number" required value={form.emergencyPhone} onChange={(v)=>update('emergencyPhone',v)} placeholder="Enter contact number" inputMode="tel"/><Field label="Relationship" required value={form.relationship} onChange={(v)=>update('relationship',v)} placeholder="e.g. Brother, Friend, Parent" className="sm:col-span-2"/></div></div>
        <div className="rounded-2xl bg-secondary/55 p-4 sm:p-5"><h3 className="text-[13px] font-bold">Additional Information <span className="font-normal text-muted-foreground">(Optional)</span></h3><div className="mt-4"><Field label="Any medical condition?" value={form.medical} onChange={(v)=>update('medical',v)} placeholder="e.g. Asthma, Diabetes"/></div></div>
      </div>
      {error && <p className="mt-4 rounded-xl bg-[#fff1ee] px-4 py-3 text-[10px] font-semibold text-[#9b4f42]">{error}</p>}
      <div className="mt-5 flex gap-3"><button type="button" onClick={onCancel} className="h-11 flex-1 rounded-full border border-border text-[11px] font-bold">Cancel</button><button type="button" onClick={save} className="h-11 flex-1 rounded-full bg-primary text-[11px] font-bold text-primary-foreground" data-testid="button-done-traveller">Done</button></div>
    </div>
  </div>;
}
