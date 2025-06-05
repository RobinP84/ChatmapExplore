// src/constants/categoryMap.js

// 1) First, export your “enum” of integer constants:
export const CATEGORY_IDS = {
  NEWS:      1,
  SPORTS:    2,
  TECH:      3,
  NIGHTLIFE: 4,
  // …etc. Add as many as you need, matching your database’s integers.
};

// 2) Now export a lookup from those integers → string‐keys.
//    These strings must match the keys inside CATEGORY_COLORS.
export const CATEGORY_ID_TO_NAME = {
  [CATEGORY_IDS.NEWS]:      'news',
  [CATEGORY_IDS.SPORTS]:    'sports',
  [CATEGORY_IDS.TECH]:      'tech',
  [CATEGORY_IDS.NIGHTLIFE]: 'nightlife',
  // …etc
};