

## Plan: Add "Save & Freeze" Button with Snapshot-Based Loading

### Problem Analysis
The current system reads table data from normalized tables (`custom_table_columns`, `custom_table_rows`, `custom_table_cells`) on every page load. The "save" button creates a version snapshot but never uses it for loading. If the normalized data gets corrupted or reset, the saved snapshots are ignored.

### Solution
Make the snapshot the **primary source of truth** for loading. When the user presses "Save & Freeze", a full JSON snapshot is stored. On next load, if a snapshot exists, it is used to rebuild the normalized tables, ensuring data integrity.

### Implementation Steps

**1. Add "Save & Freeze" button (`CustomTables.tsx`)**
- Replace the current save button with a prominent "💾 حفظ وتثبيت الجدول" button
- On click: collect all columns, rows, cells from DB into a snapshot, save to `custom_table_versions`, then show success with timestamp
- Add a visible timestamp indicator: "🟢 تم الحفظ آخر مرة: [time]" using the latest version's `saved_at`

**2. Snapshot-aware loading (`useCustomTables.ts`)**
- In `useCustomTableRows`, after fetching rows/cells, if zero rows AND zero columns exist but a saved version exists in `custom_table_versions`, auto-restore from the latest snapshot
- This prevents the "empty table on reload" scenario without changing the normal flow when data exists

**3. Add "last saved" display**
- Show the latest version timestamp from `useTableVersions` in the header next to the save status indicator
- Format: "🟢 آخر حفظ: 3:42 م" or "🟡 لم يتم الحفظ بعد"

**4. Keep auto-save (5s debounce) and beforeunload warning**
- These already exist and work correctly, no changes needed

**5. Ensure version restore works properly**
- The existing `handleRestoreVersion` deletes and re-inserts normalized data from a snapshot, which is correct
- Add `queryClient.invalidateQueries` instead of `window.location.reload()` for smoother UX

### Files to Modify
- `src/pages/CustomTables.tsx` -- UI changes (button, indicator, restore logic)
- `src/hooks/useCustomTables.ts` -- Add fallback-to-snapshot logic in row loading
- `src/hooks/useTableVersions.ts` -- No changes needed (already works)

### Technical Notes
- No database migration needed; `custom_table_versions` table already exists
- The snapshot contains `{ columns, rows, cells }` as JSON -- this is the "frozen" state
- On restore from snapshot, the normalized tables are rebuilt, so all existing queries continue to work

