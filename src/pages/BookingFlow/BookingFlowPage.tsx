import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { trips } from '@/data/trips';
import type { Trip, Traveller } from '@/types/models';
import {
  PageShell,
  BookingStepper,
} from '@/components/common';
import { readTravellerStorage } from '@/services/storage';
import { formatPrice, getBasePrice, ageFromDob } from '@/services/pricing';
import { TravellerForm } from './TravellerForm';

type PaymentMethod = 'UPI' | 'Card' | 'Net Banking';

export function BookingFlowPage({
  trip,
  onComplete,
}: {
  trip: Trip;
  onComplete: (
    travellers: Traveller[]
  ) => Promise<void> | void;
}) {
  const [step, setStep] = useState(1);
  const [travellers, setTravellers] = useState<Traveller[]>(() =>
    readTravellerStorage()
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAllTravellers, setShowAllTravellers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('UPI');

  const basePrice = getBasePrice(trip);

  const selected = travellers.filter((item) =>
    selectedIds.includes(item.id)
  );

  const visibleTravellers = showAllTravellers
    ? travellers
    : travellers.slice(0, 3);

  const toggle = (id: string) =>
    setSelectedIds((ids) => {
      if (ids.includes(id)) {
        return ids.filter((item) => item !== id);
      }

      if (ids.length >= 6) {
        return ids;
      }

      return [...ids, id];
    });

  const saveTraveller = (traveller: Traveller) => {
    setTravellers((current) => {
      const next = current.some(
        (item) => item.id === traveller.id
      )
        ? current.map((item) =>
            item.id === traveller.id ? traveller : item
          )
        : [...current, traveller];

      try {
        localStorage.setItem(
          'travel-with-trails-travellers-v1',
          JSON.stringify(next)
        );
      } catch {
        // Ignore localStorage errors.
      }

      return next;
    });

    setSelectedIds((ids) =>
      ids.includes(traveller.id)
        ? ids
        : ids.length < 6
          ? [...ids, traveller.id]
          : ids
    );

    setShowForm(false);
    setEditingId(null);
  };

  const continueToReview = () => {
    if (selected.length) {
      setStep(2);
    }
  };

  const handlePayAndConfirm = async () => {
    if (!selected.length || isSubmitting) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onComplete(selected);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Booking could not be confirmed. Please try again.';

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <main className="mx-auto max-w-[1240px] px-5 py-5 pb-12 lg:px-8 lg:py-7">
        <Link
          href={`/trips/${trip.id}`}
          className="inline-flex items-center gap-2 text-[10px] font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft size={13} />
          Back to Trip
        </Link>

        <div className="mt-5">
          <BookingStepper step={step} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_330px]">
          <section className="rounded-[24px] border border-border bg-card p-5 shadow-sm md:p-7">
            <div className="flex items-center gap-4 border-b border-border pb-5">
              <img
                src={trip.image}
                alt=""
                className="size-[72px] rounded-2xl object-cover"
              />

              <div className="min-w-0 flex-1">
                <h1 className="font-display text-[23px] font-semibold">
                  {trip.title}
                </h1>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  {trip.dates} · {trip.location}
                </p>
              </div>

              <div className="text-right">
                <p className="font-mono-ui text-[18px] font-bold text-primary">
                  {formatPrice(basePrice)}
                </p>

                <p className="text-[9px] text-muted-foreground">
                  per person
                </p>
              </div>
            </div>

            {step === 1 && (
              <>
                <div className="mt-7 flex items-end justify-between">
                  <div>
                    <h2 className="font-display text-[30px] tracking-[-.03em]">
                      Select Travellers
                    </h2>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Add the travellers who will be joining this trip.
                    </p>
                  </div>

                  <strong className="text-[11px]">
                    {selected.length}/6 Selected
                  </strong>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
                  {travellers.length ? (
                    visibleTravellers.map((traveller, index) => (
                      <div
                        key={traveller.id}
                        className="flex items-center gap-3 border-b border-border px-4 py-4 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(traveller.id)}
                          onChange={() => toggle(traveller.id)}
                          className="size-4 accent-[hsl(var(--primary))]"
                        />

                        <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-primary">
                          {traveller.name
                            .split(' ')
                            .map((x) => x[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase() || index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[12px] font-bold">
                              {traveller.name}
                            </p>

                            {index === 0 && (
                              <span className="rounded-full bg-[#dcebdc] px-2 py-1 text-[8px] font-bold text-primary">
                                Primary
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {traveller.gender} ·{' '}
                            {ageFromDob(traveller.dob)} years
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(traveller.id);
                            setShowForm(true);
                          }}
                          className="text-[10px] font-bold text-primary"
                          data-testid={`button-edit-traveller-${index + 1}`}
                        >
                          Edit
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <Users
                        size={30}
                        className="mx-auto text-muted-foreground/50"
                      />

                      <p className="mt-4 font-display text-[20px]">
                        No travellers added yet
                      </p>

                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Add traveller details to continue with your booking.
                      </p>
                    </div>
                  )}
                </div>

                {travellers.length > 3 && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowAllTravellers((value) => !value)
                    }
                    className="mt-4 text-[11px] font-bold text-primary underline-offset-4 hover:underline"
                  >
                    {showAllTravellers ? 'Show less' : 'See more'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setShowForm(true);
                  }}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary/60 text-[11px] font-bold text-primary hover:bg-secondary"
                  data-testid="button-add-new-traveller"
                >
                  <span className="text-xl leading-none">+</span>
                  Add New Traveller
                </button>

                <div className="mt-4 rounded-xl bg-[#e9eff3] px-4 py-3 text-[10px] text-[#314c62]">
                  ⓘ You can save as many travellers as you want. Only 6
                  travellers can be selected for one booking.
                </div>

                <div className="mt-7 flex justify-end">
                  <button
                    type="button"
                    disabled={!selected.length}
                    onClick={continueToReview}
                    className={`h-12 w-full rounded-full text-[11px] font-bold sm:w-[280px] ${
                      selected.length
                        ? 'bg-primary text-primary-foreground'
                        : 'cursor-not-allowed bg-secondary text-muted-foreground'
                    }`}
                  >
                    Continue
                    <ArrowRight
                      size={15}
                      className="ml-1 inline"
                    />
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="mt-7 font-display text-[30px]">
                  Review Booking
                </h2>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  Check your traveller details before payment.
                </p>

                <div className="mt-6 space-y-3">
                  {selected.map((traveller, index) => (
                    <div
                      key={traveller.id}
                      className="rounded-2xl border border-border p-4"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="text-[12px] font-bold">
                            {traveller.name}

                            {index === 0 && (
                              <span className="ml-1 rounded-full bg-[#dcebdc] px-2 py-1 text-[8px] text-primary">
                                Primary
                              </span>
                            )}
                          </p>

                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {traveller.gender} ·{' '}
                            {ageFromDob(traveller.dob)} years
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(traveller.id);
                            setShowForm(true);
                            setStep(1);
                          }}
                          className="text-[10px] font-bold text-primary"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-secondary/60 p-5">
                  <div className="flex justify-between text-[11px]">
                    <span>Price per person</span>
                    <strong>{formatPrice(basePrice)}</strong>
                  </div>

                  <div className="mt-2 flex justify-between text-[11px]">
                    <span>Travellers</span>
                    <strong>× {selected.length}</strong>
                  </div>

                  <div className="mt-3 flex justify-between border-t border-border pt-3 text-[14px] font-bold">
                    <span>Total</span>
                    <strong>
                      {formatPrice(basePrice * selected.length)}
                    </strong>
                  </div>
                </div>

                <div className="mt-7 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 flex-1 rounded-full border border-border text-[11px] font-bold"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="h-12 flex-1 rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
                  >
                    Continue to Payment
                    <ArrowRight
                      size={15}
                      className="ml-1 inline"
                    />
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="mt-7 font-display text-[30px]">
                  Payment
                </h2>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  Choose a payment method to complete your booking.
                </p>

                <div className="mt-6 rounded-2xl border border-border p-5">
                  <p className="text-[11px] font-bold">
                    Payment method
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {(
                      ['UPI', 'Card', 'Net Banking'] as PaymentMethod[]
                    ).map((method) => {
                      const isSelected =
                        paymentMethod === method;

                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() =>
                            setPaymentMethod(method)
                          }
                          aria-pressed={isSelected}
                          className={`rounded-xl border p-4 text-left text-[11px] font-bold transition-colors ${
                            isSelected
                              ? 'border-primary bg-secondary text-primary'
                              : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                          }`}
                        >
                          {method}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 rounded-xl bg-secondary/60 p-4">
                    <div className="flex justify-between text-[11px]">
                      <span>Booking total</span>

                      <strong>
                        {formatPrice(basePrice * selected.length)}
                      </strong>
                    </div>

                    <p className="mt-2 text-[9px] text-muted-foreground">
                      Selected payment method: {paymentMethod}
                    </p>

                    <p className="mt-1 text-[9px] text-muted-foreground">
                      Secure demo payment · No real charge will be made.
                    </p>
                  </div>

                  {submitError && (
                    <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-[10px] font-medium text-destructive">
                      {submitError}
                    </div>
                  )}
                </div>

                <div className="mt-7 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-12 flex-1 rounded-full border border-border text-[11px] font-bold"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handlePayAndConfirm}
                    className={`h-12 flex-1 rounded-full text-[11px] font-bold text-primary-foreground ${
                      isSubmitting
                        ? 'cursor-not-allowed bg-primary/70'
                        : 'bg-primary'
                    }`}
                    data-testid="button-pay-booking"
                  >
                    {isSubmitting
                      ? 'Confirming…'
                      : 'Pay & Confirm Booking'}
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className="hidden lg:block">
            <div className="rounded-[24px] bg-[#e6ecdf] p-6">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-primary">
                Booking summary
              </p>

              <h3 className="mt-3 font-display text-[24px] leading-tight">
                {trip.title}
              </h3>

              <p className="mt-2 text-[10px] text-muted-foreground">
                {trip.dates}
              </p>

              <div className="mt-6 space-y-3 border-t border-primary/10 pt-5 text-[11px]">
                <div className="flex justify-between">
                  <span>Travellers</span>
                  <strong>{selected.length}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Price / person</span>
                  <strong>{formatPrice(basePrice)}</strong>
                </div>

                <div className="flex justify-between border-t border-primary/10 pt-3 text-[14px]">
                  <span>Total</span>
                  <strong>
                    {formatPrice(basePrice * selected.length)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <p className="text-[11px] font-bold">
                Why we ask for these details
              </p>

              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Traveller details help us coordinate your stay,
                communication and emergency support during the journey.
              </p>
            </div>
          </aside>
        </div>

        {showForm && (
          <TravellerForm
            initial={
              editingId
                ? travellers.find(
                    (item) => item.id === editingId
                  )
                : undefined
            }
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
            onDone={saveTraveller}
          />
        )}
      </main>
    </PageShell>
  );
}