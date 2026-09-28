import React from 'react';
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react';
import { track } from '../../lib/analytics';

/**
 * Keeps one broken page from taking the whole app down. React unmounts the
 * entire tree when a render throws, which is how a single bad reference
 * turned into a black screen — this catches it, shows the student a way out,
 * and leaves the sidebar and the rest of the app working.
 *
 * Resets automatically when the route changes, so navigating away fixes it.
 */
export default class RouteBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prev) {
    if (prev.routeKey !== this.props.routeKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error(`[route/${this.props.routeKey || 'unknown'}]`, error, info?.componentStack);
    try { track('route_error', { route: this.props.routeKey || 'unknown', message: String(error?.message || error).slice(0, 120) }); } catch (_) { /* never throw from the boundary */ }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-[640px] mx-auto rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center" data-testid="route-error">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <div className="text-[16px] font-semibold text-slate-900">This page hit a problem</div>
        <div className="text-[13px] text-slate-600 mt-1">Nothing you did is lost, your work is saved. Try it again, or go back to the dashboard.</div>
        <div className="text-[11.5px] text-slate-500 mt-2 font-mono break-words">{String(this.state.error?.message || this.state.error).slice(0, 160)}</div>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <button type="button" onClick={() => this.setState({ error: null })} className="btn-outline-dark inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px]"><RotateCcw className="w-4 h-4" /> Try again</button>
          <button type="button" onClick={() => { window.location.hash = '#dashboard'; this.setState({ error: null }); }} className="btn-violet inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium"><LayoutDashboard className="w-4 h-4" /> Dashboard</button>
        </div>
      </div>
    );
  }
}
