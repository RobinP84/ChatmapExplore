import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Which post (by ID) has its InfoWindow currently expanded?
  selectedPostId: null,
  setSelectedPostId: (id) => set({ selectedPostId: id }),

  // Whether the “Make Post” InfoWindow is open
  isMakePostOpen: false,
  setIsMakePostOpen: (open) => set({ isMakePostOpen: open }),
}));