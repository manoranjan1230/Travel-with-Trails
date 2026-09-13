import alpineHero from '@/assets/alpine-hero.jpg';
import spitiValley from '@/assets/spiti-valley.jpg';
import kedarnath from '@/assets/kedarnath.jpg';
import valleyFlowers from '@/assets/valley-flowers.jpg';
import type { Trip } from '@/types/models';

export { alpineHero, spitiValley, kedarnath, valleyFlowers };

export const trips: Trip[] = [
  { id: 'bir-billing-weekend', title: 'Bir Billing Weekend', location: 'Himachal Pradesh', image: alpineHero, days: 3, nights: 2, difficulty: 'Easy', price: '₹ 6,999', rating: '4.8', category: 'Himalayas', blurb: 'Paragliding, cafes, waterfalls and more.', group: '8–15 people', dates: '20 Sep – 22 Sep 2026' },
  { id: 'spiti-valley-expedition', title: 'Spiti Valley Expedition', location: 'Himachal Pradesh', image: spitiValley, days: 7, nights: 6, difficulty: 'Moderate', price: '₹ 24,999', rating: '4.9', category: 'Himalayas', blurb: 'Monasteries, high-altitude villages and wide-open skies.', group: '6–12 people', dates: '10 Oct – 16 Oct 2026' },
  { id: 'kedarnath-yatra', title: 'Kedarnath Yatra', location: 'Uttarakhand', image: kedarnath, days: 5, nights: 4, difficulty: 'Moderate', price: '₹ 18,499', rating: '4.8', category: 'Devotional', blurb: 'A thoughtful pilgrimage through the Garhwal highlands.', group: '8–18 people', dates: '12 May – 16 May 2026' },
  { id: 'valley-of-flowers', title: 'Valley of Flowers', location: 'Uttarakhand', image: valleyFlowers, days: 6, nights: 5, difficulty: 'Moderate', price: '₹ 16,999', rating: '4.9', category: 'Himalayas', blurb: 'Meadows, mist and a riot of Himalayan wildflowers.', group: '6–14 people', dates: '02 Aug – 07 Aug 2026' },
  { id: 'kasol-kheer-ganga', title: 'Kasol — Tosh — Kheerganga', location: 'Himachal Pradesh', image: alpineHero, days: 4, nights: 3, difficulty: 'Moderate', price: '₹ 8,499', rating: '4.7', category: 'Himalayas', blurb: 'River cafes, cedar forests and mountain views.', group: '8–16 people', dates: '14 Nov – 17 Nov 2026' },
  { id: 'tirthan-valley', title: 'Tirthan Valley', location: 'Himachal Pradesh', image: valleyFlowers, days: 4, nights: 3, difficulty: 'Easy', price: '₹ 8,499', rating: '4.7', category: 'Himalayas', blurb: 'A slow weekend beside clear rivers and old forests.', group: '6–12 people', dates: '06 Dec – 09 Dec 2026' },
];
