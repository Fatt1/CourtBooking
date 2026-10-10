import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { OwnerBranchItem } from '@/features/court-owners/types/branch';

interface BranchState {
  selectedBranchId: string | null;
  selectedBranch: OwnerBranchItem | null;
  branches: OwnerBranchItem[];
}

interface BranchActions {
  setSelectedBranchId: (id: string | null) => void;
  setSelectedBranch: (branch: OwnerBranchItem | null) => void;
  setBranches: (branches: OwnerBranchItem[]) => void;
  clearBranchState: () => void;
}

export type BranchStore = BranchState & BranchActions;

export const useBranchStore = create<BranchStore>()(
  devtools(
    persist(
      (set) => ({
        selectedBranchId: null,
        selectedBranch: null,
        branches: [],

        setSelectedBranchId: (id) =>
          set(
            (state) => {
              const matched = state.branches.find((b) => b.id === id) || null;
              return {
                selectedBranchId: id,
                selectedBranch: matched || (id ? state.selectedBranch : null),
              };
            },
            false,
            'branch/setSelectedBranchId'
          ),

        setSelectedBranch: (branch) =>
          set(
            {
              selectedBranch: branch,
              selectedBranchId: branch?.id ?? null,
            },
            false,
            'branch/setSelectedBranch'
          ),

        setBranches: (branches) =>
          set(
            (state) => {
              // Nếu chưa chọn hoặc branch đã chọn không còn trong danh sách thì tự chọn branch đầu tiên
              const currentId = state.selectedBranchId;
              const hasCurrent = branches.some((b) => b.id === currentId);
              const nextSelected = hasCurrent
                ? branches.find((b) => b.id === currentId) || null
                : branches[0] || null;

              return {
                branches,
                selectedBranchId: nextSelected?.id ?? null,
                selectedBranch: nextSelected,
              };
            },
            false,
            'branch/setBranches'
          ),

        clearBranchState: () =>
          set(
            { selectedBranchId: null, selectedBranch: null, branches: [] },
            false,
            'branch/clearBranchState'
          ),
      }),
      {
        name: 'court-booking-selected-branch',
        partialize: (state) => ({
          selectedBranchId: state.selectedBranchId,
          selectedBranch: state.selectedBranch,
        }),
      }
    ),
    { name: 'BranchStore' }
  )
);
