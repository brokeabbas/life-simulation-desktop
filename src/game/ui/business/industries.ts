// src/game/ui/business/industries.ts
import type { IndustryId } from '../../store';

export const INDUSTRIES: { id: IndustryId; name: string; desc: string }[] = [
  { id: 'tech',        name: 'Technology',  desc: 'Software products, SaaS, platforms.' },
  { id: 'food',        name: 'Food',        desc: 'Restaurants, catering, packaged foods.' },
  { id: 'fashion',     name: 'Fashion',     desc: 'Clothing & accessories brands.' },
  { id: 'transport',   name: 'Transport',   desc: 'Logistics, ride-hailing, delivery.' },
  { id: 'health',      name: 'Health',      desc: 'Clinics, wellness, diagnostics.' },
  { id: 'education',   name: 'Education',   desc: 'Tutoring, courses, ed-tech.' },
  { id: 'agriculture', name: 'Agriculture', desc: 'Farms, processing, inputs.' },
  { id: 'energy',      name: 'Energy',      desc: 'Power, solar, gensets, fuels.' },
  { id: 'media',       name: 'Media',       desc: 'Content, studios, advertising.' },
];
