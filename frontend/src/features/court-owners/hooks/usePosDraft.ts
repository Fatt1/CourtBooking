import { useState } from 'react';
import { posDraftSchema, type PosDraft } from '../schemas/retailOrderSchema';

export const emptyPosDraft = (): PosDraft => ({ lines: [], discount: '0' });

export function usePosDraft(userId: string, branchId: string) {
  const key = `courtbooking-pos:${userId}:${branchId}`;
  const [draft, setDraft] = useState<PosDraft>(() => {
    try {
      const result = posDraftSchema.safeParse(JSON.parse(localStorage.getItem(key) ?? 'null'));
      if (result.success) return result.data;
    } catch { /* Use an empty cart if browser storage is unavailable. */ }
    return emptyPosDraft();
  });

  const updateDraft = (next: PosDraft) => {
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* The current cart still works in memory. */ }
    setDraft(next);
  };

  return { draft, updateDraft };
}
