import { useEffect, useState, type FormEvent } from 'react';
import {
  MapPin,
  Phone,
  Shield,
  UserRound,
  Mail,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { PageShell } from '@/components/common';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { readCurrentUser, signOut } from '@/services/auth';
import { saveUserProfileToFirestore } from '@/services/storage';

const defaultImage =
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80';

type ProfileData = {
  name: string;
  email: string;
  mobile: string;
  address: string;
  gender: string;
  age: string;
  profileImageUrl: string;
  emergencyNumber: string;
};

function buildProfileFromUser(
  current = readCurrentUser()
): ProfileData {
  return {
    name: current?.name || 'Google Traveller',
    email: current?.email || 'traveller@google.com',
    mobile: current?.mobile || 'Not added',
    address: current?.address || 'No address added yet',
    gender: current?.gender || 'Not added',
    age: typeof current?.age === 'number' ? String(current.age) : 'Not added',
    profileImageUrl: current?.profileImageUrl || defaultImage,
    emergencyNumber: current?.emergencyNumber || 'Not added',
  };
}

export function ProfilePage() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<ProfileData>(() =>
    buildProfileFromUser()
  );
  const [isEditing, setIsEditing] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const syncProfile = () => {
      const nextUser = readCurrentUser();

      if (!nextUser) {
        setProfile(buildProfileFromUser(null));
        setIsEditing(false);
        return;
      }

      setProfile(buildProfileFromUser(nextUser));
    };

    window.addEventListener(
      'travel-with-trails-auth-changed',
      syncProfile
    );

    return () =>
      window.removeEventListener(
        'travel-with-trails-auth-changed',
        syncProfile
      );
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      setProfile(buildProfileFromUser(null));
      setIsEditing(false);
      setLogoutDialogOpen(false);
      setLocation('/login');
    }
  };

  const updateField = (
    key: keyof ProfileData,
    value: string
  ) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [key]: value,
    }));
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();

    const nextProfile: ProfileData = {
      name: profile.name.trim() || 'Traveller',
      email: profile.email.trim() || 'traveller@google.com',
      mobile: profile.mobile.trim() || 'Not added',
      address:
        profile.address.trim() || 'No address added yet',
      gender: profile.gender.trim() || 'Not added',
      age: profile.age.trim() || 'Not added',
      profileImageUrl:
        profile.profileImageUrl.trim() || defaultImage,
      emergencyNumber:
        profile.emergencyNumber.trim() || 'Not added',
    };

    const currentUser = readCurrentUser();

    if (currentUser?.id) {
      const parsedAge =
        nextProfile.age === 'Not added' || nextProfile.age.trim() === ''
          ? undefined
          : Number(nextProfile.age);

      await saveUserProfileToFirestore({
        id: currentUser.id,
        name: nextProfile.name,
        email: nextProfile.email,
        mobile: nextProfile.mobile === 'Not added' ? '' : nextProfile.mobile,
        emergencyNumber:
          nextProfile.emergencyNumber === 'Not added'
            ? ''
            : nextProfile.emergencyNumber,
        profileImageUrl: nextProfile.profileImageUrl,
        address:
          nextProfile.address === 'No address added yet'
            ? ''
            : nextProfile.address,
        gender: nextProfile.gender === 'Not added' ? '' : nextProfile.gender,
        age: parsedAge,
        role: currentUser.role || 'traveller',
      });
    }

    localStorage.setItem(
      'travel-with-trails-current-user',
      JSON.stringify({
        ...currentUser,
        ...nextProfile,
        age: nextProfile.age === 'Not added' ? undefined : Number(nextProfile.age),
        gender: nextProfile.gender === 'Not added' ? '' : nextProfile.gender,
      })
    );

    setProfile(nextProfile);
    setIsEditing(false);
  };

  return (
    <PageShell>
      <main className="mx-auto min-h-[calc(100dvh-72px)] max-w-[1080px] px-5 py-10 md:px-8">
        <section className="overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_18px_70px_hsl(154_30%_20%/.08)]">
          <div className="grid md:grid-cols-[320px_1fr]">
            <aside className="relative min-h-[440px] overflow-hidden bg-primary p-8 text-primary-foreground">
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: `url(${profile.profileImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="mb-8 flex items-center justify-between">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/12 text-primary-foreground backdrop-blur">
                      <UserRound size={24} />
                    </span>

                    <span className="rounded-full border border-white/30 bg-white/8 px-4 py-2 text-[9px] font-bold uppercase tracking-[.2em]">
                      Profile
                    </span>
                  </div>

                  <div className="mt-8 flex flex-col items-center">
                    <img
                      src={profile.profileImageUrl}
                      alt={profile.name}
                      className="h-36 w-36 rounded-full border-4 border-white/80 object-cover shadow-xl"
                    />

                    <div className="mt-5 text-center">
                      <p className="font-display text-[30px] leading-tight tracking-[-.035em]">
                        {profile.name}
                      </p>

                      <p className="mt-2 text-[10px] uppercase tracking-[.16em] text-[#e4e8d9]/76">
                        Traveller profile
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/12 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Shield
                      size={16}
                      className="text-[#f0c983]"
                    />

                    <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#e4e8d9]">
                      Travel safety
                    </span>
                  </div>

                  <p className="mt-3 text-[11px] leading-relaxed text-[#eef1e9]/78">
                    Your emergency contact and trip profile are
                    ready for your next trail.
                  </p>
                </div>
              </div>
            </aside>

            <section className="p-7 md:p-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.24em] text-primary/75">
                    Traveller details
                  </p>

                  <h1 className="mt-2 font-display text-[34px] leading-tight tracking-[-.035em]">
                    My Profile
                  </h1>
                </div>

                <Link
                  href="/"
                  className="rounded-full border border-border px-4 py-2 text-[10px] font-bold text-muted-foreground transition-colors hover:text-primary"
                >
                  Back to trips
                </Link>
              </div>

              {!isEditing ? (
                <>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-background/70 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
                          <UserRound size={16} />
                        </span>

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">
                            User Info
                          </p>

                          <p className="mt-1 font-display text-[22px] leading-tight tracking-[-.02em]">
                            {profile.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background/70 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
                          <Mail size={16} />
                        </span>

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">
                            Email
                          </p>

                          <p className="mt-1 font-medium text-[12px] text-foreground">
                            {profile.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background/70 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
                          <Phone size={16} />
                        </span>

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">
                            Mobile Number
                          </p>

                          <p className="mt-1 font-medium text-[12px] text-foreground">
                            {profile.mobile}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background/70 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
                          <AlertCircle size={16} />
                        </span>

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">
                            Emergency Number
                          </p>

                          <p className="mt-1 font-medium text-[12px] text-foreground">
                            {profile.emergencyNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2 rounded-2xl border border-border bg-background/70 p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
                          <MapPin size={16} />
                        </span>

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">
                            Address
                          </p>

                          <p className="mt-1 font-medium leading-relaxed text-[12px] text-foreground">
                            {profile.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-background/70 p-4">
                        <p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">
                          Gender
                        </p>
                        <p className="mt-2 font-medium text-[12px] text-foreground">
                          {profile.gender}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-background/70 p-4">
                        <p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">
                          Age
                        </p>
                        <p className="mt-2 font-medium text-[12px] text-foreground">
                          {profile.age}
                        </p>
                      </div>
                    </div>

                    <div className="sm:col-span-2 rounded-2xl border border-border bg-background/70 p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
                          <ImageIcon size={16} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">
                            Profile Image URL
                          </p>

                          <a
                            href={profile.profileImageUrl}
                            className="mt-1 block max-w-full break-all font-medium text-[12px] text-primary hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {profile.profileImageUrl}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="rounded-full bg-primary px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.16em] text-primary-foreground transition-transform hover:scale-[1.02]"
                    >
                      Edit profile
                    </button>

                    <Link
                      href="/bookings"
                      className="rounded-full border border-border px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground transition-colors hover:text-primary"
                    >
                      My bookings
                    </Link>

                    <AlertDialog
                      open={logoutDialogOpen}
                      onOpenChange={setLogoutDialogOpen}
                    >
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="rounded-full border border-destructive px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.16em] text-destructive transition-colors hover:bg-destructive/5"
                        >
                          Logout
                        </button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you sure you want to logout?
                          </AlertDialogTitle>

                          <AlertDialogDescription>
                            You will be signed out and returned to
                            the login page.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            Cancel
                          </AlertDialogCancel>

                          <AlertDialogAction
                            onClick={handleLogout}
                          >
                            Logout
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              ) : (
                <form
                  onSubmit={saveProfile}
                  className="mt-8 rounded-2xl border border-border bg-background/70 p-5"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                        Name
                      </span>

                      <input
                        value={profile.name}
                        onChange={(event) =>
                          updateField(
                            'name',
                            event.target.value
                          )
                        }
                        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                        Email
                      </span>

                      <input
                        value={profile.email}
                        onChange={(event) =>
                          updateField(
                            'email',
                            event.target.value
                          )
                        }
                        type="email"
                        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                        Mobile number
                      </span>

                      <input
                        value={
                          profile.mobile === 'Not added'
                            ? ''
                            : profile.mobile
                        }
                        onChange={(event) =>
                          updateField(
                            'mobile',
                            event.target.value
                              .replace(/\D/g, '')
                              .slice(0, 10)
                          )
                        }
                        type="tel"
                        inputMode="numeric"
                        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                        Emergency number
                      </span>

                      <input
                        value={
                          profile.emergencyNumber === 'Not added'
                            ? ''
                            : profile.emergencyNumber
                        }
                        onChange={(event) =>
                          updateField(
                            'emergencyNumber',
                            event.target.value
                              .replace(/\D/g, '')
                              .slice(0, 10)
                          )
                        }
                        type="tel"
                        inputMode="numeric"
                        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary"
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                        Address
                      </span>

                      <textarea
                        value={
                          profile.address ===
                          'No address added yet'
                            ? ''
                            : profile.address
                        }
                        onChange={(event) =>
                          updateField(
                            'address',
                            event.target.value
                          )
                        }
                        className="min-h-[84px] w-full rounded-xl border border-border bg-background px-4 py-3 text-[12px] outline-none focus:border-primary"
                      />
                    </label>

                    <div className="block sm:col-span-2 grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                          Gender
                        </span>

                        <select
                          value={profile.gender === 'Not added' ? '' : profile.gender}
                          onChange={(event) =>
                            updateField('gender', event.target.value)
                          }
                          className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary"
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                          Age
                        </span>

                        <input
                          value={profile.age === 'Not added' ? '' : profile.age}
                          onChange={(event) =>
                            updateField('age', event.target.value.replace(/\D/g, '').slice(0, 3))
                          }
                          type="number"
                          min="1"
                          max="120"
                          className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary"
                        />
                      </label>
                    </div>

                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                        Profile image URL
                      </span>

                      <input
                        value={profile.profileImageUrl}
                        onChange={(event) =>
                          updateField(
                            'profileImageUrl',
                            event.target.value
                          )
                        }
                        type="url"
                        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[12px] outline-none focus:border-primary"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-full bg-primary px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.16em] text-primary-foreground transition-transform hover:scale-[1.02]"
                    >
                      Save profile
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-full border border-border px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground transition-colors hover:text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </section>
      </main>
    </PageShell>
  );
}