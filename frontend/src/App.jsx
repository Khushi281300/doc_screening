import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseWorkspace from './pages/CaseWorkspace';
import SearchPage from './pages/SearchPage';
import AuditTrail from './pages/AuditTrail';
import Sidebar, { MobileNav } from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { checkHealth } from './api/client';
import { Spinner } from './components/ui';

function Portal() {
  const [tab, setTab] = useState('dashboard');
  const [online, setOnline] = useState(true);
  const [focusCase, setFocusCase] = useState(null);

  const ping = useCallback(() => { checkHealth().then(() => setOnline(true)).catch(() => setOnline(false)); }, []);
  useEffect(() => { ping(); const t = setInterval(ping, 30000); return () => clearInterval(t); }, [ping]);

  const openCase = (caseId) => { setFocusCase(caseId); setTab('cases'); };

  return (
    <div className="app-shell">
      <Sidebar activeTab={tab} onSelectTab={setTab} />
      <div className="app-main">
        <Navbar online={online} activeTab={tab} onRecheck={ping} />
        <main className="app-body fade-up" key={tab}>
          {tab === 'dashboard' && <Dashboard onOpenCase={openCase} onGoTo={setTab} />}
          {tab === 'cases' && <CaseWorkspace initialCaseId={focusCase} />}
          {tab === 'search' && <SearchPage onOpenCase={openCase} />}
          {tab === 'audit' && <AuditTrail onOpenCase={openCase} />}
        </main>
        <Footer online={online} />
      </div>
      <MobileNav activeTab={tab} onSelectTab={setTab} />
    </div>
  );
}

function Gate() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground gap-2"><Spinner /> Restoring session…</div>;
  }
  return isAuthenticated ? <Portal /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
