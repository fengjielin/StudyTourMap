import { defineStore } from 'pinia';
import type { Base } from '@/types';

interface BasesState {
  bases: Base[];
  isLoading: boolean;
}

export const useBasesStore = defineStore('bases', {
  state: (): BasesState => ({
    bases: JSON.parse(sessionStorage.getItem('bases') || '[]'),
    isLoading: false,
  }),

  actions: {
    setBases(bases: Base[]) {
      this.bases = bases;
      sessionStorage.setItem('bases', JSON.stringify(bases));
    },
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },
  },
});
