import { PageShell } from '@/components/common';

export function AdminPage() {
  return (
    <PageShell>
      <main className="mx-auto min-h-[calc(100dvh-72px)] max-w-[960px] px-5 py-12 md:px-8">
        <section className="rounded-[30px] border border-border bg-card p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary/75">Admin</p>
              <h1 className="mt-2 font-display text-[34px] leading-tight tracking-[-.035em]">Dashboard</h1>
            </div>
            <span className="rounded-full bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-primary-foreground">Protected</span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background/70 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">Trips</p>
              <p className="mt-2 font-display text-[30px] tracking-[-.03em]">06</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">Bookings</p>
              <p className="mt-2 font-display text-[30px] tracking-[-.03em]">24</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">Users</p>
              <p className="mt-2 font-display text-[30px] tracking-[-.03em]">18</p>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
