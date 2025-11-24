// src/data/profile-photos.ts

// Type d�fini localement pour �viter import circulaire
export interface AaaPhoto {
  url: string;
  role: 'lawyer' | 'expat';
  gender: 'male' | 'female';
  countries?: string[];
  weight?: number;
}

// Exemple minimal — complète avec tes URLs DALL·E / libres de droits
export const PROFILE_PHOTOS: AaaPhoto[] = [
  // Avocats hommes
  { url: 'https://…/lawyer-m-01.jpg', role: 'lawyer', gender: 'male', countries: ['France','Canada'], weight: 2 },
  { url: 'https://…/lawyer-m-02.jpg', role: 'lawyer', gender: 'male' },

  // Avocates femmes
  { url: 'https://…/lawyer-f-01.jpg', role: 'lawyer', gender: 'female', countries: ['Thaïlande'] },

  // Expat hommes
  { url: 'https://…/expat-m-01.jpg', role: 'expat', gender: 'male' },

  // Expat femmes
  { url: 'https://…/expat-f-01.jpg', role: 'expat', gender: 'female', countries: ['Espagne','Portugal'] },
];
