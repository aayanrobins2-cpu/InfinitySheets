// Every delete asks first. One wording everywhere:
//   "Are you sure you want to delete <what>? This can't be undone."
export function confirmDelete(what = 'this') {
  try {
    return window.confirm(`Are you sure you want to delete ${what}? This can't be undone.`);
  } catch (_) {
    return false;
  }
}
