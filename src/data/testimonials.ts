export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  age: number;
  city: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote: "It's the first thing that didn't make me feel like I was the problem.",
    name: 'Sandra',
    age: 26,
    city: 'New York',
  },
  {
    id: 't2',
    quote: "I texted it at 2am and it actually helped me understand myself better. That hasn't happened with a person in a while.",
    name: 'Chelsea',
    age: 29,
    city: 'Austin',
  },
  {
    id: 't3',
    quote: "I cried the first time. Then I came back the next night.",
    name: 'Maria',
    age: 24,
    city: 'Toronto',
  },
];

export function pickTestimonial(): Testimonial {
  const i = Math.floor(Math.random() * TESTIMONIALS.length);
  return TESTIMONIALS[i];
}
