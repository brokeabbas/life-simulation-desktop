// src/game/lifestyle/categories.ts
export type Category =
  | 'health_food'
  | 'job'
  | 'business'
  | 'career'
  | 'education'
  | 'government'
  | 'assets'
  | 'bank'
  | 'lifestyle'
  | 'properties'
  | 'media'
  | 'relationship'
  | 'pets'
  | 'will'
  | 'lottery'
  | 'shop'
  | 'become_infamous';

export const CATEGORY_LABEL: Record<Category, string> = {
  health_food: 'Health / Food',
  job: 'Job',
  business: 'Business',
  career: 'Career',
  education: 'Education',
  government: 'Government',
  assets: 'Assets',
  bank: 'Bank',
  lifestyle: 'Lifestyle',
  properties: 'Properties',
  media: 'Media',
  relationship: 'Relationship',
  pets: 'Pets',
  will: 'Will',
  lottery: 'Lottery',
  shop: 'Shop',
  become_infamous: 'Become Infamous',
};

export const ALL_CATEGORIES: Category[] = Object.keys(CATEGORY_LABEL) as Category[];

export function tagsForCategory(cat: Category): string[] {
  switch (cat) {
    case 'health_food': return ['health', 'food', 'fitness', 'daily'];
    case 'job': return ['job', 'career', 'work'];
    case 'career': return ['career', 'job', 'promotion'];
    case 'business': return ['business', 'startup', 'company'];
    case 'education': return ['school', 'university', 'education', 'study'];
    case 'government': return ['gov', 'government', 'tax', 'civic'];
    case 'assets': return ['asset', 'assets', 'invest'];
    case 'bank': return ['bank', 'finance', 'money'];
    case 'lifestyle': return ['daily', 'lifestyle', 'habit'];
    case 'properties': return ['property', 'realestate', 'home'];
    case 'media': return ['media', 'social', 'press'];
    case 'relationship': return ['relationship', 'social', 'friend', 'family'];
    case 'pets': return ['pets', 'animal'];
    case 'will': return ['will', 'estate'];
    case 'lottery': return ['lottery', 'luck', 'gamble'];
    case 'shop': return ['shop', 'shopping', 'market'];
    case 'become_infamous': return ['crime', 'infamy', 'illegal'];
    default: return [];
  }
}
