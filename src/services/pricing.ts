import type { Trip } from '@/types/models';
export function formatPrice(amount:number){return `₹ ${Math.round(amount).toLocaleString('en-IN')}`;}
export function getBasePrice(trip:Trip){return Number(trip.price.replace(/[^\d]/g,''));}
export function ageFromDob(dob:string){if(!dob)return '';const date=new Date(dob);if(Number.isNaN(date.getTime()))return '';const today=new Date();let age=today.getFullYear()-date.getFullYear();const month=today.getMonth()-date.getMonth();if(month<0||(month===0&&today.getDate()<date.getDate()))age--;return age>=0?String(age):'';}
