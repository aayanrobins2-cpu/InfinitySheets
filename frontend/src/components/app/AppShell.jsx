import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, GraduationCap, Pencil, FileText, Library, History, TrendingUp, Dumbbell, Sparkles, AlertTriangle, Settings, Shield, BookOpen, Layers, Users, CalendarClock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Dashboard from './Dashboard';
import StartStudying from './StartStudying';
import Worksheets from './Worksheets';
import WorksheetHistory from './WorksheetHistory';
import ProgressView from './ProgressView';
import Strengths from './Strengths';
import Mistakes from './Mistakes';
import Recommendations from './Recommendations';
import SettingsView from './SettingsView';
import MyCourses from './MyCourses';
import TutorialOverlay from './TutorialOverlay';
import CourseWizard from './CourseWizard';
import QuestionBank from './QuestionBank';
import AdminPlaceholder from './AdminPlaceholder';
import CourseOverview from './CourseOverview';
import TopicOverview from './TopicOverview';
import ResourcesPage from '../landing/ResourcesPage';
import Sidebar from './shell/Sidebar';
import PlusCheckout from './PlusCheckout';
import ExamTimetable from './ExamTimetable';
import { TwoStepGate, useTwoStepGate } from './TwoStep';
import AdblockNotice from '../AdblockNotice';
import { getWorksheetJob, subscribeWorksheetJob } from '../../lib/worksheetJob';
import TopHeader from './shell/TopHeader';
import NotesFlashcards from './NotesFlashcards';
import RouteBoundary from './RouteBoundary';
import { dayKey, effectiveStreak } from '../../lib/streak';
import Groups from './Groups';
import ConsentGate from './ConsentGate';
import CommandPalette from './CommandPalette';
import { isPlus } from '../../lib/entitlements';
import { PlusPreview } from './PlusLock';
import { pageview } from '../../lib/analytics';
import { maybeRemind } from '../../lib/reminders';
import { dueReviews } from '../../lib/spacedRepetition';
import StudyDecor from '../decor/StudyDecor';

const BASE_NAV = [
  { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'courses', label: 'My Courses', Icon: GraduationCap },
  { key: 'study', label: 'Start Studying', Icon: Pencil },
  { key: 'history', label: 'Worksheet History', Icon: History },
  { key: 'progress', label: 'Performance', Icon: TrendingUp },
  { key: 'strengths', label: 'Strengths & Weaknesses', Icon: Dumbbell },
  { key: 'recommendations', label: 'Smart Learning', Icon: Sparkles },
  { key: 'flashcards', label: 'Notes & Flashcards', Icon: Layers },
  { key: 'groups', label: 'Study Groups', Icon: Users },
  { key: 'settings', label: 'Settings', Icon: Settings },
];
const ADMIN_ITEM = { key: 'admin', label: 'Admin', Icon: Shield };
const HIDDEN_ROUTES = [
  // Off the sidebar (each subject page links its syllabus now), but old
  // #qbank links still open it.
  { key: 'qbank', label: 'Syllabus Bank', Icon: Library },
  { key: 'worksheets', label: 'Create a Worksheet', Icon: FileText },
  { key: 'mistakes', label: 'Mistake History', Icon: AlertTriangle },
  { key: 'course-overview', label: 'Course Overview', Icon: GraduationCap },
  { key: 'topic', label: 'Topic overview', Icon: GraduationCap },
  // Reachable from the landing footer / topic pages even though it left the sidebar.
  { key: 'resources', label: 'Free Resources', Icon: BookOpen },
  { key: 'plus', label: 'InfinitySheets+', Icon: Sparkles },
  { key: 'exams', label: 'Exam Timetable', Icon: CalendarClock },
];

const SIDEBAR_STORAGE_KEY = 'infinitysheets_sidebar_open';
const MOBILE_QUERY = '(max-width: 767px)';

function useIsMobile() {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false);
  const [isMobile, setIsMobile] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    // Safari <14 support: addListener/removeListener fallback.
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    setIsMobile(mql.matches);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, []);
  return isMobile;
}

function parseHash(hash) {
  const raw = (hash || '').replace(/^#/, '');
  const [key, query] = raw.split('?');
  const params = {};
  (query || '').split('&').filter(Boolean).forEach((pair) => {
    const [k, v = ''] = pair.split('=');
    // Links encode their values (`subject=Mathematics%20AA`); hand pages the
    // real text. A malformed escape falls back to the raw value.
    try { params[k] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (_) { params[k] = v; }
  });
  return { key: key || 'dashboard', params };
}

function renderRoute(activeKey, params, go, isAdmin) {
  switch (activeKey) {
    case 'dashboard': return <Dashboard go={go} />;
    case 'courses': return <MyCourses />;
    case 'study': return <StartStudying go={go} subjectParam={params.subject} boardParam={params.board} levelParam={params.level} />;
    case 'worksheets': return <Worksheets go={go} />;
    case 'qbank': return <QuestionBank go={go} subjectParam={params.subject} boardParam={params.board} levelParam={params.level} />;
    case 'history': return <WorksheetHistory />;
    case 'progress': return <ProgressView />;
    case 'strengths': return <Strengths />;
    case 'recommendations': return <Recommendations go={go} />;
    case 'mistakes': return <Mistakes />;
    case 'settings': return <SettingsView />;
    case 'flashcards': return <NotesFlashcards go={go} />;
    case 'groups': return <Groups />;
    case 'resources': return <ResourcesPage embedded />;
    case 'plus': return <PlusCheckout />;
    case 'exams': return <ExamTimetable go={go} />;
    case 'admin': return isAdmin ? <AdminPlaceholder /> : <Dashboard go={go} />;
    case 'course-overview': return <CourseOverview courseId={params.id} go={go} />;
    case 'topic': return <TopicOverview subject={params.subject} topic={params.topic} boardParam={params.board} levelParam={params.level} go={go} />;
    default: return <Dashboard go={go} />;
  }
}

export default function AppShell({ hash }) {
  const { state, syncStatus, apiLogout, toggleTheme, exitDemo, setTestPlan } = useApp();
  const plus = isPlus(state);
  const isDemo = !!state.user?.isDemo;
  const { key: active, params } = parseHash(hash);
  const isAdmin = state.user?.role === 'admin';
  // No page is locked for free accounts (AI is rationed by credits instead).
  const PLUS_NAV = {};
  const NAV = (isAdmin ? [...BASE_NAV, ADMIN_ITEM] : BASE_NAV).map((n) => (PLUS_NAV[n.key] && !plus ? { ...n, locked: true } : n));
  const ALL_ITEMS = [...NAV, ...HIDDEN_ROUTES];
  const [wsJob, setWsJob] = useState(getWorksheetJob());
  useEffect(() => subscribeWorksheetJob(setWsJob), []);
  const current = ALL_ITEMS.find((n) => n.key === active) || NAV[0];

  // Sidebar collapse state — persisted so it survives refreshes on desktop.
  // On mobile the sidebar starts closed and never persists.
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return v === null ? true : v === '1';
    } catch (_) {
      return true;
    }
  });
  // Whenever we cross the mobile / desktop breakpoint, snap to sensible defaults.
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    else {
      try {
        const v = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        setSidebarOpen(v === null ? true : v === '1');
      } catch (_) { setSidebarOpen(true); }
    }
  }, [isMobile]);
  useEffect(() => {
    // Only persist the desktop preference.
    if (isMobile) return;
    try { localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarOpen ? '1' : '0'); } catch (_) {}
  }, [sidebarOpen, isMobile]);

  const go = (k) => {
    // For authenticated users, `resources` renders inside the shell so the
    // sidebar stays visible (see the `case 'resources'` route above). For
    // anonymous users, App.js intercepts `#resources` and shows the
    // standalone landing ResourcesPage instead.
    window.location.hash = `#${k}`;
    // Auto-close the drawer after a route change on mobile so the page
    // becomes visible again.
    if (isMobile) setSidebarOpen(false);
  };
  // Analytics page views + the once-a-day study reminder check.
  const mainRef = useRef(null);
  useEffect(() => { pageview(current.key); if (mainRef.current) mainRef.current.scrollTop = 0; }, [current.key]);
  useEffect(() => {
    const check = () => maybeRemind({
      enabled: !!state.settings?.pushReminders,
      hour: state.settings?.reminderHour ?? 18,
      dueCount: dueReviews(state.worksheets || []).length,
      studiedToday: dayKey(state.lastStudyDate) === dayKey(new Date()),
      streak: effectiveStreak({ streak: state.streak, lastStudyDate: state.lastStudyDate }),
    });
    check();
    const id = setInterval(check, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [state.settings?.pushReminders, state.settings?.reminderHour, state.worksheets, state.lastStudyDate, state.streak]);
  const isDark = state.theme === 'dark';
  // New account: age question → choose courses → short tutorial.
  const showConsent = !state.consent;
  const showOnboarding = !!state.consent && !state.onboardingDone;
  const showTutorial = !!state.consent && state.onboardingDone && !state.tutorialDone;

  // Ctrl/⌘ K command palette.
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((v) => !v); }
      // Cmd/Ctrl + Shift + 2 (or W, where the browser lets the page have it)
      // → Create a worksheet. Uses e.code: Shift+2 types "@" / '"' by layout.
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.code === 'Digit2' || e.code === 'KeyW')) { e.preventDefault(); window.location.hash = '#worksheets'; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const exitAccount = async () => {
    await apiLogout();
    window.location.hash = '';
  };
  // Two-step verification: an account with an authenticator app must enter
  // its code before the app opens (after password, Google, or a reload).
  const twoStep = useTwoStepGate(!!state.user?.id && !state.user?.isDemo);

  return (
    <div className="h-screen overflow-hidden section-bg flex relative">
      {twoStep.status === 'needs-code' && <TwoStepGate onVerified={twoStep.recheck} onSignOut={exitAccount} />}
      {/* Ad blocker / VPN wall: only inside the app, where the ads are — never
          on the landing, privacy or public resources pages. */}
      <AdblockNotice />
      {/* Academic line art gives the app's glass surfaces something meaningful to reveal. */}
      <StudyDecor density="app" />
      {/* Mobile scrim — dim the app when the drawer is open so the page
          content becomes clearly "behind" the sidebar. */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          data-testid="sidebar-scrim"
        />
      )}

      {/* Sidebar. On desktop it participates in the flex row and animates its
          own width. On mobile it becomes a fixed drawer that slides in from
          the left over the content. */}
      <div
        className={
          isMobile
            ? `fixed inset-y-0 left-0 z-40 w-[280px] transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `shrink-0 transition-[width,opacity,transform] duration-300 ease-out overflow-hidden ${sidebarOpen ? 'w-[240px] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4'}`
        }
        aria-hidden={!sidebarOpen}
      >
        <div className={isMobile ? 'w-full h-screen' : 'w-[240px] h-screen'}>
          <Sidebar
            nav={NAV}
            activeKey={current.key}
            onNavigate={go}
            plus={plus}
            onLogout={exitAccount}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      <main ref={mainRef} data-app-scroll className="min-w-0 flex-1 relative h-screen overflow-y-auto overscroll-contain">
        {isDemo && (
          <div className="sticky top-0 z-30 bg-violet-600 text-white text-[12.5px] font-medium px-4 py-1.5 flex items-center justify-center gap-3" data-testid="demo-banner">
            <span>Test mode, sample data, nothing is saved.</span>
            <span className="inline-flex items-center rounded-full bg-white/15 p-0.5 text-[11px] font-semibold">
              <button type="button" onClick={() => setTestPlan('free')} className={`px-2 py-0.5 rounded-full ${state.testPlan !== 'plus' ? 'bg-white text-violet-700' : 'text-white/90'}`} data-testid="test-plan-free">Free</button>
              <button type="button" onClick={() => setTestPlan('plus')} className={`px-2 py-0.5 rounded-full ${state.testPlan === 'plus' ? 'bg-white text-violet-700' : 'text-white/90'}`} data-testid="test-plan-plus">InfinitySheets+</button>
            </span>
            <button type="button" onClick={exitDemo} className="underline underline-offset-2 hover:opacity-90" data-testid="demo-exit">Exit test mode</button>
          </div>
        )}
        <TopHeader
          title={current.label}
          activeKey={current.key}
          isDark={isDark}
          courseCount={(state.courses || []).length}
          onToggleTheme={toggleTheme}
          onNewWorksheet={() => go('worksheets')}
          sidebarOpen={sidebarOpen && !isMobile}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          syncStatus={syncStatus}
        />
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7 max-w-[1280px]">
          <RouteBoundary routeKey={current.key}>
            {current.key === 'worksheets' ? null : PLUS_NAV[current.key] && !plus ? <PlusPreview feature={PLUS_NAV[current.key]}>{renderRoute(current.key, params, go, isAdmin)}</PlusPreview> : renderRoute(current.key, params, go, isAdmin)}
          </RouteBoundary>
          {/* The worksheet builder lives in its own slot so it can keep writing
              a sheet in the background while another page is open. */}
          {(current.key === 'worksheets' || wsJob !== 'idle') && (
            <div className={current.key === 'worksheets' ? '' : 'hidden'} aria-hidden={current.key !== 'worksheets'}>
              <RouteBoundary routeKey="worksheets"><Worksheets go={go} active={current.key === 'worksheets'} /></RouteBoundary>
            </div>
          )}
        </div>
      </main>

      {showConsent && <ConsentGate />}
      {showOnboarding && <CourseWizard mode="onboarding" />}
      {showTutorial && <TutorialOverlay />}
      <CommandPalette nav={NAV} go={go} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
