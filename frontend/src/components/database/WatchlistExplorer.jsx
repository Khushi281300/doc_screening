import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Search, Plus, X, Trash2, Zap, AlertTriangle, UserCheck } from 'lucide-react';

export default function WatchlistExplorer({
  currentScan,
  customMetadata = {},
  watchlist = [],
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onSelectScenarioPreset,
  onFlagCurrentDocument
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocNum, setNewDocNum] = useState('');
  const [newName, setNewName] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newSeverity, setNewSeverity] = useState('CRITICAL');

  // Currently inspected document info
  const activeDocNum = (customMetadata?.documentNumber || currentScan?.document_fields?.document_number || 'P74209188').toUpperCase();
  const activeName   = (customMetadata?.fullName || currentScan?.document_fields?.full_name || 'UZUMAKI NARUTO').toUpperCase();

  // Check if currently active document matches any watchlist entry
  const activeHit = watchlist.find(item =>
    item.document_number?.toUpperCase() === activeDocNum ||
    item.holder_name?.toUpperCase() === activeName
  );

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newDocNum || !newName) return;
    if (onAddToWatchlist) {
      await onAddToWatchlist({
        document_number: newDocNum.toUpperCase(),
        holder_name: newName.toUpperCase(),
        reason: newReason || 'Border Security Alert Flag',
        severity: newSeverity
      });
    }
    setShowAddModal(false);
    setNewDocNum('');
    setNewName('');
    setNewReason('');
  };

  // Translate raw system reason strings into human-friendly labels
  const friendlyReason = (raw = '') => {
    if (!raw) return 'Security Alert Flag';
    const r = raw.toLowerCase();
    if (r.includes('counterfeit') || r.includes('red notice') || r.includes('interpol')) return 'Wanted: Counterfeit Syndicate';
    if (r.includes('lost') || r.includes('stolen') || r.includes('transit')) return 'Reported Lost or Stolen';
    if (r.includes('travel ban') || r.includes('visa') || r.includes('sanction') || r.includes('revoked')) return 'Travel Ban (Visa Violation)';
    if (r.includes('watchlist') || r.includes('security alert') || r.includes('border control')) return 'Border Security Alert';
    return raw;
  };

  // Format ISO date string -> "Sep 14, 2026"
  const formatDate = (raw) => {
    if (!raw) return 'Active';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return raw; }
  };

  // Human-readable severity label
  const friendlySeverity = (sev) => {
    if (sev === 'CRITICAL') return 'Critical Alert';
    if (sev === 'HIGH') return 'High Priority';
    if (sev === 'WARN') return 'Warning Notice';
    return sev || 'Unknown';
  };

  const filtered = watchlist.filter(item =>
    (item.document_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.holder_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.reason || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div>
        <h1 style={{
          fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, cursive, serif',
          fontStyle: 'italic',
          fontSize: 28,
          color: '#0F172A',
        }}>
          Flagged Traveler & Stolen ID Watchlist ðŸ¾
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
          Instantly checks every scanned passport against national security lists, stolen passport databases, and travel bans.
        </p>
      </div>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          1. Live Scanned Document Cross-Check Card
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="card" style={{
        padding: 20,
        background: activeHit ? 'linear-gradient(135deg, #FFF5F7, #FEF1F3)' : 'linear-gradient(135deg, #F9FDFB, #F0F8F3)',
        border: `1.5px solid ${activeHit ? '#F8BAC7' : '#BCDCC7'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: activeHit ? '#DC2626' : '#4A8C5C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${activeHit ? 'rgba(209,73,102,0.3)' : 'rgba(74,140,92,0.3)'}`,
              flexShrink: 0
            }}>
              {activeHit ? <ShieldAlert size={24} color="#FFFFFF" /> : <ShieldCheck size={24} color="#FFFFFF" />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: activeHit ? '#DC2626' : '#4A8C5C' }}>
                  Live Scanned Document Status
                </span>
                <span className={`pill ${activeHit ? 'pill-red' : 'pill-green'}`} style={{ fontSize: 10 }}>
                  {activeHit ? 'âš ï¸ Alert: Passport is Flagged' : 'Clear â€” No Match Found'}
                </span>
              </div>

              <h2 style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontStyle: 'italic',
                fontSize: 22,
                color: activeHit ? '#B91C1C' : '#2B5A37',
                marginTop: 2,
                lineHeight: 1.2
              }}>
                {activeHit ? 'Active Travel Restriction Alert' : 'Verified Clear of All Watchlists'}
              </h2>

              <p style={{ fontSize: 12.5, color: '#334155', marginTop: 4 }}>
                Inspecting: <strong style={{ fontFamily: 'monospace', color: '#1E293B' }}>{activeDocNum}</strong> ({activeName})
                {activeHit && (
                  <span style={{ display: 'block', color: '#B91C1C', fontWeight: 600, marginTop: 2 }}>
                    Reason: {friendlyReason(activeHit.reason)} ({friendlySeverity(activeHit.severity)})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activeHit ? (
              <button
                type="button"
                onClick={() => onRemoveFromWatchlist && onRemoveFromWatchlist(activeDocNum)}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '8px 14px', borderRadius: 12, borderColor: '#BCDCC7', color: '#2B5A37' }}
              >
                <ShieldCheck size={14} color="#4A8C5C" />
                <span>Clear Flag / Whitelist</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onFlagCurrentDocument && onFlagCurrentDocument(activeDocNum, activeName)}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '8px 14px', borderRadius: 12, borderColor: '#F8BAC7', color: '#B91C1C' }}
              >
                <ShieldAlert size={14} color="#DC2626" />
                <span>Simulate Alert Hit on This ID</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick 1-Click Simulation Pills */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${activeHit ? '#F8D2DB' : '#D5EBDC'}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>
            Quick Simulation Presets (Test Alert Scenarios):
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onSelectScenarioPreset && onSelectScenarioPreset('blacklisted_identity')}
              style={{
                background: '#FFFFFF', border: '1px solid #F8BAC7', borderRadius: 12,
                padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#B91C1C', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5
              }}
            >
              <Zap size={12} color="#DC2626" />
              <span>Viktor Reznikov (Interpol Red Notice: X99887766)</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectScenarioPreset && onSelectScenarioPreset('stolen_passport')}
              style={{
                background: '#FFFFFF', border: '1px solid #F8D6B0', borderRadius: 12,
                padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#8C4D14', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5
              }}
            >
              <AlertTriangle size={12} color="#B66D26" />
              <span>Marcus Vance (Stolen Passport: P12345678)</span>
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          2. Action & Search Bar
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: '#FEF1F3', border: '1px solid #F8BAC7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldAlert size={17} color="#DC2626" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              Active Registry Database
            </div>
            <div style={{ fontSize: 11, color: '#64748B' }}>
              {watchlist.length} documents on file
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: 'auto' }}>
          <div style={{ position: 'relative', minWidth: 200, flex: '1 1 auto' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              placeholder="Search document # or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, fontSize: 12, width: '100%', height: 38 }}
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ fontSize: 12, padding: '9px 16px', borderRadius: 12, height: 38, whiteSpace: 'nowrap' }}
          >
            <Plus size={14} /> Add New Entry
          </button>
        </div>
      </div>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          3. Registry Display: Desktop Table + Mobile Cards
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="card" style={{ overflow: 'hidden', background: '#FFFFFF' }}>
        
        {/* Desktop Table View (Scrolls cleanly if viewport < 650px) */}
        <div className="table-scroll-container">
          <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Document #</th>
                <th style={{ padding: '12px 16px' }}>Traveler Name</th>
                <th style={{ padding: '12px 16px' }}>Flag Reason</th>
                <th style={{ padding: '12px 16px' }}>Severity Level</th>
                <th style={{ padding: '12px 16px' }}>Date Added</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94A3B8' }}>
                    No matching watchlist entries found.
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id || item.document_number} style={{ borderBottom: '1px solid #F9EBF0' }}>
                    <td style={{ padding: '14px 16px', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#0F766E' }}>
                      {item.document_number}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                      {item.holder_name}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>
                      {friendlyReason(item.reason)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`pill ${item.severity === 'CRITICAL' ? 'pill-red' : 'pill-amber'}`}>
                        {friendlySeverity(item.severity)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 11.5 }}>
                      {formatDate(item.listed_date)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => onRemoveFromWatchlist && onRemoveFromWatchlist(item.document_number)}
                        style={{
                          background: '#F0FDFA', border: '1px solid #CBD5E1', borderRadius: 8,
                          padding: '4px 8px', color: '#DC2626', cursor: 'pointer', fontSize: 11
                        }}
                        title="Deactivate entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          4. Add Document Modal
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 120,
          background: 'rgba(46, 27, 36, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: 22,
            width: '100%',
            maxWidth: 420,
            padding: 24,
            boxShadow: '0 12px 36px rgba(212,120,154,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{
                fontFamily: '"Cormorant Garamond", Georgia, cursive, serif',
                fontStyle: 'italic',
                fontSize: 22,
                color: '#0F172A',
              }}>
                Add Document to Alert List
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Document Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. L99228811"
                  value={newDocNum}
                  onChange={e => setNewDocNum(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Holder Name
                </label>
                <input
                  type="text"
                  placeholder="SURNAME FIRSTNAME"
                  value={newName}
                  onChange={e => setNewName(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Reason for Flag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Interpol Red Notice, Reported stolen"
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Severity Level
                </label>
                <select
                  value={newSeverity}
                  onChange={e => setNewSeverity(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 12,
                    border: '1.5px solid #E2E8F0', fontSize: 12, background: '#FFFFFF', color: '#0F172A'
                  }}
                >
                  <option value="CRITICAL">CRITICAL (Immediate Arrest / Confiscate)</option>
                  <option value="HIGH">HIGH (Secondary Screening Flag)</option>
                  <option value="WARN">WARN (Observation Notice)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Alert Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

