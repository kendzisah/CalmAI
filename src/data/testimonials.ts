// HARD GATE per spec §3 Screen 11: every quote here must be replaced with a real
// beta-user quote (with explicit written permission for first name + age + city)
// before launch. The placeholders below are clearly labeled as samples so the
// proof screen renders without looking broken during pre-launch dev.

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  age: number;
  city: string;
}

export const PLACEHOLDER_TESTIMONIALS: Testimonial[] = [
  {
    id: 'sample-1',
    quote: "It's the first thing that doesn't make me feel like a problem to solve.",
    name: 'Sample',
    age: 26,
    city: 'New York',
  },
  {
    id: 'sample-2',
    quote: "I texted it at 2am and it actually got it. That hasn't happened with a person in a while.",
    name: 'Sample',
    age: 29,
    city: 'Austin',
  },
  {
    id: 'sample-3',
    quote: "I cried the first time. Then I came back the next night.",
    name: 'Sample',
    age: 24,
    city: 'Toronto',
  },
];

export function pickTestimonial(): Testimonial {
  const i = Math.floor(Math.random() * PLACEHOLDER_TESTIMONIALS.length);
  return PLACEHOLDER_TESTIMONIALS[i];
}
