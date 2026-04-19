import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const AdminDashboard = () => {
  const [user, setUser]           = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState({ eventType: '', date: '' });
  const [expandedId, setExpandedId] = useState(null);

  const fetchQuotations = async () => {
    try {
      const snap = await getDocs(collection(db, 'quotations'));
      const quotes = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        submittedAt: d.data().submittedAt?.toDate(),
      }));
      setQuotations(quotes);
    } catch (err) {
      console.error('Error fetching quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) fetchQuotations();
      else setLoading(false);
    });
    return unsub;
  }, []);

  const handleLogin = async e => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  };

  const handleLogout = () => signOut(auth);

  const markAsContacted = async id => {
    try {
      await updateDoc(doc(db, 'quotations', id), { status: 'contacted' });
      fetchQuotations();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name','Email','Phone','Event Type','Event Date','Location','Services','Duration','Budget','Price','Status','Submitted At'];
    const rows = quotations.map(q => [
      q.fullName, q.email, q.phone, q.eventType, q.eventDate,
      q.eventLocation, q.services?.join('; '), q.duration,
      q.budgetRange, q.estimatedPrice, q.status,
      q.submittedAt?.toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(f => `"${f ?? ''}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'quotations.csv' });
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = quotations.filter(q => {
    if (filter.eventType && q.eventType !== filter.eventType) return false;
    if (filter.date && q.eventDate !== filter.date) return false;
    return true;
  });

  const totalValue = quotations.reduce((s, q) => s + (q.estimatedPrice || 0), 0);

  /* ── LOGIN ── */
  if (!user) {
    return (
      <div className="ad-login-page">
        <div className="ad-login-card">
          <div className="ad-login-logo">
            <h2>FrameStudio</h2>
            <p>Admin Access Portal</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="ad-field">
              <label className="ad-label">Email Address</label>
              <input
                className="ad-input"
                type="email"
                placeholder="admin@framestudio.in"
                value={loginData.email}
                onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div className="ad-field">
              <label className="ad-label">Password</label>
              <input
                className="ad-input"
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="ad-btn-primary">Sign In</button>
            <div className="ad-login-footer">Secure · Firebase Authentication</div>
          </form>
        </div>
      </div>
    );
  }

  /* ── LOADING ── */
  if (loading) {
    return (
      <div className="ad-loading-page">
        <div className="ad-loading-inner">
          <div className="ad-loading-dot" />
          <span>Loading quotations…</span>
        </div>
      </div>
    );
  }

  /* ── DASHBOARD ── */
  return (
    <div className="ad-page">

      {/* Nav */}
      <div className="ad-nav">
        <div className="ad-nav-left">
          <span className="ad-brand">FrameStudio</span>
          <span className="ad-badge">Admin Panel</span>
        </div>
        <div className="ad-nav-right">
          <button className="ad-btn-ghost" onClick={exportToCSV}>Export CSV</button>
          <button className="ad-btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="ad-body">

        {/* Stats */}
        <div className="ad-stats">
          <div className="ad-stat">
            <div className="ad-stat-num cream">{quotations.length}</div>
            <div className="ad-stat-lbl">Total Quotations</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat-num green">
              {quotations.filter(q => q.status === 'contacted').length}
            </div>
            <div className="ad-stat-lbl">Contacted</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat-num amber">
              {quotations.filter(q => q.status !== 'contacted').length}
            </div>
            <div className="ad-stat-lbl">Pending</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat-num gold">
              ₹{totalValue >= 100000
                ? `${(totalValue / 100000).toFixed(1)}L`
                : totalValue.toLocaleString()}
            </div>
            <div className="ad-stat-lbl">Pipeline Value</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="ad-toolbar">
          <div className="ad-toolbar-title">Recent Quotations</div>
          <div className="ad-filters">
            <select
              className="ad-filter-input"
              value={filter.eventType}
              onChange={e => setFilter(p => ({ ...p, eventType: e.target.value }))}
            >
              <option value="">All Event Types</option>
              <option value="wedding">Wedding</option>
              <option value="pre-wedding">Pre-Wedding</option>
              <option value="birthday">Birthday</option>
              <option value="corporate">Corporate</option>
              <option value="others">Others</option>
            </select>
            <input
              className="ad-filter-input"
              type="date"
              value={filter.date}
              onChange={e => setFilter(p => ({ ...p, date: e.target.value }))}
            />
            {(filter.eventType || filter.date) && (
              <button
                className="ad-btn-ghost"
                onClick={() => setFilter({ eventType: '', date: '' })}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="ad-table-wrap">
          {filtered.length === 0 ? (
            <div className="ad-empty">No quotations match the current filters.</div>
          ) : (
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Event</th>
                  <th>Services</th>
                  <th>Estimate</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => (
                  <>
                    <tr key={q.id} className="ad-row">
                      <td>
                        <div className="ad-cell-name">{q.fullName}</div>
                        <div className="ad-cell-sub">{q.email}</div>
                        <div className="ad-cell-sub">{q.phone}</div>
                      </td>
                      <td>
                        <div className="ad-cell-name" style={{ textTransform: 'capitalize' }}>{q.eventType}</div>
                        <div className="ad-cell-sub">{q.eventLocation}</div>
                        <div className="ad-cell-sub">{q.eventDate}</div>
                      </td>
                      <td>
                        <div className="ad-cell-sub">
                          {q.services?.join(' · ') || '—'}
                        </div>
                        <div className="ad-cell-sub" style={{ marginTop: '0.2rem' }}>
                          {q.duration}
                        </div>
                      </td>
                      <td>
                        <div className="ad-cell-price">₹{q.estimatedPrice?.toLocaleString()}</div>
                      </td>
                      <td>
                        <span className={`ad-status ${q.status || 'pending'}`}>
                          {q.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        <div className="ad-cell-sub">
                          {q.submittedAt?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <div className="ad-action-row">
                          {q.status !== 'contacted' && (
                            <button
                              className="ad-tbl-btn contact"
                              onClick={() => markAsContacted(q.id)}
                            >
                              Mark Contacted
                            </button>
                          )}
                          <button
                            className="ad-tbl-btn"
                            onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                          >
                            {expandedId === q.id ? 'Hide' : 'View Details'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedId === q.id && (
                      <tr key={`${q.id}-detail`} className="ad-detail-row">
                        <td colSpan={7}>
                          <div className="ad-detail-inner">
                            <div className="ad-detail-grid">
                              <div>
                                <div className="ad-detail-label">Budget Range</div>
                                <div className="ad-detail-val">{q.budgetRange || '—'}</div>
                              </div>
                              <div>
                                <div className="ad-detail-label">Special Requests</div>
                                <div className="ad-detail-val">{q.specialRequests || 'None'}</div>
                              </div>
                              <div>
                                <div className="ad-detail-label">Reference Images</div>
                                <div className="ad-detail-val">
                                  {q.referenceImages?.length > 0
                                    ? `${q.referenceImages.length} image(s) uploaded`
                                    : 'None uploaded'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;