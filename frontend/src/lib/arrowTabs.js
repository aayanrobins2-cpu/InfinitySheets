// Left / right (and up / down) arrow keys move between a row of tabs, like a
// native tab bar: focus follows and the new tab is selected. Home / End jump
// to the first / last. Use as onKeyDown on the tablist.
export function arrowTabs(keys, current, select) {
  return (e) => {
    const i = keys.indexOf(current);
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = keys[(i + 1) % keys.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = keys[(i - 1 + keys.length) % keys.length];
    else if (e.key === 'Home') next = keys[0];
    else if (e.key === 'End') next = keys[keys.length - 1];
    if (next == null) return;
    e.preventDefault();
    select(next);
    const tabs = e.currentTarget.querySelectorAll('[role="tab"]');
    const el = tabs[keys.indexOf(next)];
    if (el) el.focus();
  };
}
