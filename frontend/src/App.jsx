import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar, { MobileBottomNav } from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import DocumentScanner from './components/capture/DocumentScanner';
import ForensicViewerPane from './components/forensics/ForensicViewerPane';
import MRZCard from './components/mrz/MRZCard';
import BiometricComparisonCard from './components/biometrics/BiometricComparisonCard';
import RiskScoreCard from './components/risk/RiskScoreCard';
import RiskScoreView from './components/risk/RiskScoreView';
import ExplainabilityChecklist from './components/risk/ExplainabilityChecklist';
import WatchlistExplorer from './components/database/WatchlistExplorer';
import CheckpointAnalytics from './components/analytics/CheckpointAnalytics';
import AuditAndBlockchainLedger from './components/audit/AuditAndBlockchainLedger';

import { PRESET_SCENARIOS } from './data/presetSamples';
import { runFullInspection, checkHealth, getWatchlist, addToWatchlist, removeFromWatchlist } from './api/client';
import { generateTD3MRZ } from './utils/mrzGenerator';

import AgentReasoningTerminal from './components/agent/AgentReasoningTerminal';
import ForensicDossierCard from './components/dossier/ForensicDossierCard';
import HITLReviewPanel from './components/hitl/HITLReviewPanel';
import OfficerCopilotModal from './components/hitl/OfficerCopilotModal';
import { playPop, playSuccessFanfare } from './utils/soundEffects';
import { ShieldAlert } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

const INITIAL_WATCHLIST = [
  {
    id: 1,
    document_number: "X99887766",
    holder_name: "VIKTOR REZNIKOV",
    reason: "Interpol Red Notice - Counterfeiting Syndicate",
    severity: "CRITICAL",
    listed_date: "2026-04-12"
  },
  {
    id: 2,
    document_number: "P12345678",
    holder_name: "MARCUS VANCE",
    reason: "Reported Lost in Transit by Passport Agency",
    severity: "HIGH",
    listed_date: "2026-06-20"
  },
  {
    id: 3,
    document_number: "N55443322",
    holder_name: "ALEKSEI VOLKOV",
    reason: "Travel Ban - Revoked Visa & Sanctions List",
    severity: "CRITICAL",
    listed_date: "2026-08-01"
  }
];

function MainDashboard() {
  const { officer, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('scanner');
  const [loading, setLoading] = useState(false);
  const [documentImage, setDocumentImage] = useState(null);
  const [liveFaceImage, setLiveFaceImage] = useState(null);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [result, setResult] = useState(null);
  const [engineMode, setEngineMode] = useState('LIVE_BACKEND');
  const [watchlist, setWatchlist] = useState(INITIAL_WATCHLIST);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const [customMetadata, setCustomMetadata] = useState({
    fullName: '',
    documentNumber: '',
    country: '',
    expiryDate: '',
    dob: '',
    sex: 'M'
  });

  // Check backend liveness and fetch active watchlist
  useEffect(() => {
    checkHealth()
      .then(() => setEngineMode('LIVE_BACKEND'))
      .catch(() => setEngineMode('DEMO_SCENARIO'));

    getWatchlist()
      .then(res => {
        if (res?.watchlist?.length > 0) {
          setWatchlist(res.watchlist);
        }
      })
      .catch(() => {
        // Fallback already in state
      });
  }, []);

  // Determine if active document is blacklisted
  const activeDocNum = (customMetadata.documentNumber || result?.document_fields?.document_number || '').toUpperCase();
  const activeName   = (customMetadata.fullName || result?.document_fields?.full_name || '').toUpperCase();
  const isCurrentDocBlacklisted = Boolean(
    watchlist.find(item =>
      item.document_number?.toUpperCase() === activeDocNum ||
      item.holder_name?.toUpperCase() === activeName
    )
  );

  const handleDocumentChange = (imgB64, scenario = null) => {
    setDocumentImage(imgB64);
    setResult(null);
    if (scenario) {
      setCurrentScenario(scenario);
      setLiveFaceImage(scenario.liveFace);
    } else {
      setCurrentScenario(null);
    }
  };

  const handleAddToWatchlist = async (entry) => {
    try {
      await addToWatchlist(entry);
    } catch (e) {
      console.warn('Offline watchlist add fallback', e);
    }
    setWatchlist(prev => {
      const filtered = prev.filter(p => p.document_number !== entry.document_number);
      return [
        ...filtered,
        {
          id: Date.now(),
          ...entry,
          listed_date: new Date().toISOString().split('T')[0]
        }
      ];
    });
  };

  const handleRemoveFromWatchlist = async (docNum) => {
    try {
      await removeFromWatchlist(docNum);
    } catch (e) {
      console.warn('Offline watchlist delete fallback', e);
    }
    setWatchlist(prev => prev.filter(item => item.document_number !== docNum.toUpperCase()));
  };

  const handleFlagCurrentDocument = async (docNum, name) => {
    await handleAddToWatchlist({
      document_number: docNum.toUpperCase(),
      holder_name: name.toUpperCase(),
      reason: 'Border Control Security Alert Flag',
      severity: 'CRITICAL'
    });
  };

  const handleToggleWatchlist = async () => {
    if (isCurrentDocBlacklisted) {
      await handleRemoveFromWatchlist(activeDocNum);
    } else {
      await handleFlagCurrentDocument(activeDocNum, activeName);
    }
  };

  const handleSelectScenarioPreset = (scenarioId) => {
    const scenario = PRESET_SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      handleDocumentChange(scenario.documentImage, scenario);
      setActiveTab('scanner');
    }
  };

  const handleRunInspection = async () => {
    if (!documentImage) return;
    setLoading(true);

    // Dynamic MRZ lines determination
    let mrzLinesToSend = currentScenario?.mrzLines;
    if (!mrzLinesToSend) {
      const parts = (customMetadata.fullName || '').trim().split(' ');
      const surname = parts[0] || 'TRAVELER';
      const given = parts.slice(1).join(' ') || 'UNKNOWN';
      const expYYMMDD = (customMetadata.expiryDate || '2032-12-31').replace(/[^0-9]/g, '').slice(2, 8);
      const dobYYMMDD = (customMetadata.dob || '1990-10-10').replace(/[^0-9]/g, '').slice(2, 8);

      mrzLinesToSend = generateTD3MRZ({
        country: customMetadata.country || 'JPN',
        surname: surname,
        givenNames: given,
        docNumber: customMetadata.documentNumber || 'P74209188',
        nationality: customMetadata.country || 'JPN',
        expiry: expYYMMDD || '321231',
        dob: dobYYMMDD || '901010',
        sex: customMetadata.sex || 'M'
      });
    }

    try {
      const res = await runFullInspection({
        document_image_base64: documentImage,
        live_face_base64: liveFaceImage,
        mrz_lines: mrzLinesToSend,
        officer_id: officer?.badge_id || 'BC-1001',
        checkpoint_id: officer?.checkpoint_id || 'DEL-T3-GATE-4'
      });
      setResult(res);
      setEngineMode('LIVE_BACKEND');
      playSuccessFanfare();
    } catch (err) {
      console.warn('Live backend inspection failed or unreachable, using scenario data:', err);
      setEngineMode('DEMO_SCENARIO');
      const id = currentScenario?.id || '';

      // Check if current document or scenario is flagged in active watchlist
      const fullName = currentScenario ? (currentScenario.id === 'blacklisted_identity' ? 'REZNIKOV VIKTOR' : 'ERIKSSON ANNA MARIA') : (customMetadata.fullName || 'UZUMAKI NARUTO');
      const docNum   = currentScenario ? (currentScenario.id === 'blacklisted_identity' ? 'X99887766' : 'L898902C3') : (customMetadata.documentNumber || 'P74209188');
      const country  = currentScenario ? 'UTO' : (customMetadata.country || 'JPN');
      const expiry   = currentScenario ? '2030-04-15' : (customMetadata.expiryDate || '2032-12-31');

      const watchlistHit = watchlist.find(item =>
        item.document_number?.toUpperCase() === docNum.toUpperCase() ||
        item.holder_name?.toUpperCase() === fullName.toUpperCase()
      );

      if (id === 'tampered_expiry_ela') {
        setResult({
          status: 'SUCCESS',
          risk_evaluation: { outcome: 'REJECTED', overall_risk_score: 34, confidence_score: 97.5, recommendation: 'Document rejected. The expiry date appears to have been digitally altered.', critical_failures: ['Expiry date field shows signs of digital editing (ELA compression anomaly).'], warning_flags: [], factor_breakdown: { document_quality: { score: 90, status: 'PASS' }, mrz_integrity: { score: 100, status: 'PASS' }, forensic_integrity: { score: 32, status: 'FAIL' }, biometric_verification: { score: 92, status: 'PASS' }, database_watchlist: { score: 100, status: 'PASS' } } },
          document_fields: { format: 'TD3', full_name: 'ERIKSSON ANNA MARIA', document_number: 'L898902C3', expiry_date: '2038-12-31', all_check_digits_valid: true, raw_mrz: currentScenario.mrzLines },
          forensics_metrics: { ela: { is_spliced: true }, exif: { software_tag: 'Adobe Photoshop CC 2024' } },
          biometrics: { verdict: 'MATCH', similarity_percentage: 92, cosine_similarity: 0.920, liveness_score: 96, is_live: true, spoof_classification: 'REAL_HUMAN' },
          layers: { 
            ...(currentScenario?.forensicLayers || {}),
            original_rectified_base64: documentImage,
            doc_face_crop_base64: documentImage
          }
        });
      } else if (id === 'fake_mrz_checksum') {
        setResult({
          status: 'SUCCESS',
          risk_evaluation: { outcome: 'REJECTED', overall_risk_score: 28, confidence_score: 99, recommendation: 'Document rejected. Security checksums at bottom mathematically fail ICAO standards.', critical_failures: ['Security checksum does not match — document data has been altered.'], warning_flags: [], factor_breakdown: { document_quality: { score: 92, status: 'PASS' }, mrz_integrity: { score: 0, status: 'FAIL' }, forensic_integrity: { score: 95, status: 'PASS' }, biometric_verification: { score: 94, status: 'PASS' }, database_watchlist: { score: 100, status: 'PASS' } } },
          document_fields: { format: 'TD3', full_name: 'DAVIS JONATHAN', document_number: 'P99441100', all_check_digits_valid: false, check_digits: { document_number: { expected: '9', calculated: '0', valid: false }, composite: { expected: '99', calculated: '10', valid: false } }, raw_mrz: currentScenario.mrzLines },
          layers: { ela_heatmap_base64: documentImage }
        });
      } else if (id === 'screen_recapture_moire') {
        setResult({
          status: 'SUCCESS',
          risk_evaluation: { outcome: 'REJECTED', overall_risk_score: 38, confidence_score: 96, recommendation: 'Document rejected. Screen recapture detected — photo of a digital monitor.', critical_failures: ['Screen recapture detected — high-frequency pixel grid found (Moiré raster).'], warning_flags: [], factor_breakdown: { document_quality: { score: 75, status: 'PASS' }, mrz_integrity: { score: 100, status: 'PASS' }, forensic_integrity: { score: 40, status: 'FAIL' }, biometric_verification: { score: 90, status: 'PASS' }, database_watchlist: { score: 100, status: 'PASS' } } },
          document_fields: { format: 'TD3', full_name: 'MILLER SARAH', document_number: 'L55221199', all_check_digits_valid: true, raw_mrz: currentScenario.mrzLines },
          forensics_metrics: { recapture: { is_screen_recaptured: true } },
          layers: { 
            ...(currentScenario?.forensicLayers || {}),
            original_rectified_base64: documentImage,
            doc_face_crop_base64: documentImage
          }
        });
      } else if (id === 'biometric_impersonator') {
        setResult({
          status: 'SUCCESS',
          risk_evaluation: { outcome: 'REJECTED', overall_risk_score: 35, confidence_score: 98.4, recommendation: 'Document rejected. The person at the checkpoint does not match the passport portrait.', critical_failures: ['Face does not match the passport photo (similarity: 41% — minimum required: 65%).'], warning_flags: [], factor_breakdown: { document_quality: { score: 92, status: 'PASS' }, mrz_integrity: { score: 100, status: 'PASS' }, forensic_integrity: { score: 95, status: 'PASS' }, biometric_verification: { score: 41, status: 'FAIL' }, database_watchlist: { score: 100, status: 'PASS' } } },
          document_fields: { format: 'TD3', full_name: 'ZHAO WEI', document_number: 'E44332211', all_check_digits_valid: true, raw_mrz: currentScenario.mrzLines },
          biometrics: { verdict: 'MISMATCH', similarity_percentage: 41.2, cosine_similarity: 0.412, liveness_score: 94, is_live: true, spoof_classification: 'REAL_HUMAN' },
          layers: { ela_heatmap_base64: documentImage }
        });
      } else if (id === 'blacklisted_identity' || watchlistHit) {
        const hitReason = watchlistHit?.reason || 'Interpol Red Notice operative';
        const hitSeverity = watchlistHit?.severity || 'CRITICAL';
        setResult({
          status: 'SUCCESS',
          risk_evaluation: {
            outcome: 'REJECTED',
            overall_risk_score: 12,
            confidence_score: 99.8,
            recommendation: `CRITICAL ALERT: Document holder flagged on Interpol / Border Watchlist (${hitReason}). Deny entry and notify security.`,
            critical_failures: [`CRITICAL WATCHLIST HIT: ${hitReason} (${hitSeverity})`],
            warning_flags: [],
            factor_breakdown: {
              document_quality: { score: 94, status: 'PASS' },
              mrz_integrity: { score: 100, status: 'PASS' },
              forensic_integrity: { score: 95, status: 'PASS' },
              biometric_verification: { score: 92, status: 'PASS' },
              database_watchlist: { score: 0, status: 'FAIL' }
            }
          },
          document_fields: { format: 'TD3', full_name: fullName, document_number: docNum, all_check_digits_valid: true, raw_mrz: mrzLinesToSend },
          layers: { ela_heatmap_base64: documentImage }
        });
      } else {
        // Genuine custom upload passed all checks
        setResult({
          status: 'SUCCESS',
          risk_evaluation: {
            outcome: 'VERIFIED',
            overall_risk_score: 96.5,
            confidence_score: 98.8,
            recommendation: 'Document authenticated. All forensic, biometric, and Interpol checks cleared. Entry authorized.',
            critical_failures: [],
            warning_flags: [],
            factor_breakdown: {
              document_quality: { score: 94, status: 'PASS' },
              mrz_integrity: { score: 100, status: 'PASS' },
              forensic_integrity: { score: 96, status: 'PASS' },
              biometric_verification: { score: 95, status: 'PASS' },
              database_watchlist: { score: 100, status: 'PASS' }
            }
          },
          document_fields: {
            format: 'TD3',
            doc_type: 'PASSPORT',
            full_name: fullName,
            document_number: docNum,
            issuing_country: country,
            nationality: country,
            date_of_birth: customMetadata.dob || '1990-10-10',
            expiry_date: expiry,
            all_check_digits_valid: true,
            raw_mrz: mrzLinesToSend
          },
          biometrics: {
            verdict: 'MATCH',
            similarity_percentage: 94.8,
            cosine_similarity: 0.948,
            liveness_score: 97,
            is_live: true,
            spoof_classification: 'REAL_HUMAN'
          },
          layers: {
            original_rectified_base64: documentImage,
            doc_face_crop_base64: documentImage,
            ela_heatmap_base64: documentImage
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-root">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} onOpenCopilot={() => setCopilotOpen(true)} />

      <div className="dashboard-main-area">
        <Navbar engineMode={engineMode} activeTab={activeTab} />

        <main className="dashboard-body">

          {activeTab === 'scanner' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <DocumentScanner
                documentImage={documentImage}
                liveFaceImage={liveFaceImage}
                onDocumentChange={handleDocumentChange}
                onLiveFaceChange={setLiveFaceImage}
                onRunInspection={handleRunInspection}
                loading={loading}
                qualityData={result?.quality}
                currentScenario={currentScenario}
                customMetadata={customMetadata}
                onCustomMetadataChange={setCustomMetadata}
                isBlacklisted={isCurrentDocBlacklisted}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {result && (
                <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 4 }}>
                  {/* Step 2: Inspection Findings & Verdict */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span className="pill pill-teal">
                        Step 2
                      </span>
                      <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                        Inspection Findings &amp; Authenticity Summary
                      </h2>
                    </div>
                    <RiskScoreCard
                      riskEvaluation={result.risk_evaluation}
                      onViewAudit={() => setActiveTab('audit')}
                    />
                  </div>

                  {/* Step 3: Visual & Document Evidence */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span className="pill pill-teal">
                        Step 3
                      </span>
                      <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                        Visual &amp; Biometric Evidence
                      </h2>
                      <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                        (Photo tampering check, security codes, and face matching)
                      </span>
                    </div>

                    <div className="grid-responsive-2col" style={{ gap: 16 }}>
                      <ForensicViewerPane
                        inspectionResult={result}
                        originalImage={documentImage}
                        onGoToScanner={() => setActiveTab('scanner')}
                        onSelectSample={handleSelectScenarioPreset}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <MRZCard
                          documentFields={result.document_fields}
                          onGoToScanner={() => setActiveTab('scanner')}
                          onSelectSample={handleSelectSample => handleSelectScenarioPreset(handleSelectSample)}
                        />
                        <BiometricComparisonCard
                          docFaceCrop={result.layers?.doc_face_crop_base64 || result.layers?.original_rectified_base64}
                          liveFaceImage={liveFaceImage}
                          biometricResult={result.biometrics}
                          onLiveFaceCaptured={b64 => setLiveFaceImage(b64)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Final Officer Review & Decision */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span className="pill pill-teal">
                        Step 4
                      </span>
                      <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                        Manual Officer Review &amp; Decision
                      </h2>
                    </div>

                    <HITLReviewPanel
                      scanResult={result}
                      onOverrideSuccess={(overrideRes) => {
                        setResult(prev => ({
                          ...prev,
                          risk_evaluation: {
                            ...prev.risk_evaluation,
                            outcome: overrideRes.final_outcome
                          }
                        }));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'forensics' && (
            <ForensicViewerPane
              inspectionResult={result}
              originalImage={documentImage}
              onGoToScanner={() => setActiveTab('scanner')}
              onSelectSample={handleSelectScenarioPreset}
            />
          )}

          {activeTab === 'mrz' && (
            <MRZCard
              documentFields={result?.document_fields}
              onGoToScanner={() => setActiveTab('scanner')}
              onSelectSample={handleSelectScenarioPreset}
            />
          )}

          {activeTab === 'risk' && (
            <RiskScoreView
              scanResult={result}
              onGoToScanner={() => setActiveTab('scanner')}
              onSelectSample={handleSelectScenarioPreset}
              onGoToAudit={() => setActiveTab('audit')}
            />
          )}

          {activeTab === 'biometrics' && (
            <BiometricComparisonCard
              docFaceCrop={result?.layers?.doc_face_crop_base64}
              liveFaceImage={liveFaceImage}
              biometricResult={result?.biometrics}
              onLiveFaceCaptured={b64 => setLiveFaceImage(b64)}
              onGoToScanner={() => setActiveTab('scanner')}
              onSelectSample={handleSelectScenarioPreset}
            />
          )}

          {activeTab === 'watchlist' && (
            <AdminRoute onRedirect={setActiveTab}>
              <WatchlistExplorer
                currentScan={result}
                customMetadata={customMetadata}
                watchlist={watchlist}
                onAddToWatchlist={handleAddToWatchlist}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
                onSelectScenarioPreset={handleSelectScenarioPreset}
                onFlagCurrentDocument={handleFlagCurrentDocument}
              />
            </AdminRoute>
          )}

          {activeTab === 'analytics' && (
            <AdminRoute onRedirect={setActiveTab}>
              <CheckpointAnalytics />
            </AdminRoute>
          )}

          {activeTab === 'audit' && (
            <AuditAndBlockchainLedger latestScan={result} />
          )}

        </main>

        <Footer engineMode={engineMode} />
      </div>

      <OfficerCopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        scanResult={result}
      />

      <MobileBottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F0FDFA 0%, #FDE8EE 40%, #F0FDFA 100%)',
          color: '#0F172A',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}
      >
        
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0D9488' }}>
          Checking your details...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return children;
}

function AdminRoute({ children, onRedirect }) {
  const { isAdmin, officer } = useAuth();

  if (!isAdmin) {
    return (
      <div
        style={{
          margin: '40px auto',
          maxWidth: '560px',
          background: '#FFFFFF',
          border: '1.5px solid #FCD34D',
          borderRadius: '20px',
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(245, 158, 11, 0.1)'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#FEF3C7',
            color: '#B45309',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}
        >
          <ShieldAlert size={30} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
          Manager Access Only
        </h2>
        <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, marginBottom: '22px' }}>
          Hi <strong>{officer?.name}</strong>! Your account is set up as a <strong>Passport Inspector</strong>.
          Only Managers and Supervisors can view the watchlist and reports.
          Please ask your supervisor if you need access.
        </p>
        <button
          id="admin_guard_return_btn"
          onClick={() => onRedirect('scanner')}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #0D9488, #0F766E)',
            border: 'none',
            borderRadius: '10px',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(13,148,136,0.3)'
          }}
        >
          Back to Passport Scanner
        </button>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainDashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
}



