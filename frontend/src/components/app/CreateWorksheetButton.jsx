import React from 'react';
import { Plus } from 'lucide-react';

/**
 * The single, shared "Create a New Worksheet" action.
 *
 * Every standalone worksheet-creation entry point in the app renders this
 * component so the label, styling, and icon stay identical everywhere.
 * Contextual actions that belong to a topic row (e.g. "Practice these" in
 * the question bank) deliberately keep their own compact buttons — the
 * primary element there is the topic, not worksheet creation.
 *
 * Props:
 *   onClick    — required; the caller keeps its own navigation/preselect logic
 *   compact    — hides the label below `sm` (used in the tight top header)
 *   className  — extra positioning/layout classes only, never restyling
 *   ...rest    — data-testid, aria-label, disabled, etc. pass straight through
 */
// The `ring-white/25` in the class list is invisible on the app's white
// surfaces but keeps the button legible where it sits on a coloured hero
// (subject overview / course overview).
export const CREATE_WORKSHEET_LABEL = 'Create a New Worksheet';

export default function CreateWorksheetButton({ onClick, compact = false, className = '', ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={CREATE_WORKSHEET_LABEL}
      title={`${CREATE_WORKSHEET_LABEL} (${/Mac|iPhone|iPad/.test(navigator.platform || "") ? "⌘⇧2" : "Ctrl+Shift+2"})`}
      className={`btn-violet inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13.5px] font-semibold whitespace-nowrap ring-1 ring-white/25 shadow-sm transition-opacity hover:opacity-95 ${className}`}
      {...rest}
    >
      <Plus className="w-5 h-5 shrink-0" strokeWidth={2.6} />
      <span className={compact ? 'hidden sm:inline' : undefined}>{CREATE_WORKSHEET_LABEL}</span>
    </button>
  );
}
