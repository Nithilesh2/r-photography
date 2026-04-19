import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const AdminDashboard = () => {
  const [user, setUser]             = useState(null);
  const [loginData, setLoginData]   = useState({ email: '', password: '' });
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState({ eventType: '', date: '' });
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

  const markAsContacted = async id => {
    try {
      await updateDoc(doc(db, 'quotations', id), { status: 'contacted' });
      fetchQuotations();
    } catch (err) {
      console.error(err);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name','Email','Phone','Event Type','Sub Event','Event Date','Location','Services','Budget','Status','Submitted At','Special Requests'];
    const rows = quotations.map(q => [
      q.fullName, q.email, q.phone,
      q.eventType, q.subEvent || '',
      q.eventDate, q.eventLocation,
      q.services?.join('; '),
      q.budgetRange, q.status,
      q.submittedAt?.toLocaleString(),
      q.specialRequests || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(f => `"${f ?? ''}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'nayanam-quotations.csv' });
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = quotations.filter(q => {
    if (filter.eventType && q.eventType !== filter.eventType) return false;
    if (filter.date && q.eventDate !== filter.date) return false;
    return true;
  });

  const eventLabel = val => ({
    wedding: 'Wedding', birthday: 'Birthday', 'half-saree': 'Half Saree / Dothi',
    seemantham: 'Seemantham', corporate: 'Corporate', other: 'Other',
  }[val] || val);

  const subEventLabel = val => ({
    engagement: 'Engagement', pellikuthuru: 'Pellikuthuru', pellikoduku: 'Pellikoduku',
    haldi: 'Haldi', 'wedding-ceremony': 'Wedding Ceremony', reception: 'Reception',
  }[val] || val);

  /* ── LOGIN ── */
  if (!user) {
    return (
      <div className="ad-login-page">
        <div className="ad-login-card">
          <div className="ad-login-logo">
            <h2>Nayanam Stories</h2>
            <p>Admin Access Portal</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="ad-field">
              <label className="ad-label">Email Address</label>
              <input className="ad-input" type="email" placeholder="admin@nayanamstories.in"
                value={loginData.email}
                onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="ad-field">
              <label className="ad-label">Password</label>
              <input className="ad-input" type="password" placeholder="••••••••"
                value={loginData.password}
                onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))} required />
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

      <div className="ad-nav">
        <div className="ad-nav-left">
          <span className="ad-brand">Nayanam Stories</span>
          <span className="ad-badge">Admin Panel</span>
        </div>
        <div className="ad-nav-right">
          <button className="ad-btn-ghost" onClick={exportToCSV}>Export CSV</button>
          <button className="ad-btn-danger" onClick={() => signOut(auth)}>Logout</button>
        </div>
      </div>

      <div className="ad-body">

        {/* Stats */}
        <div className="ad-stats">
          <div className="ad-stat">
            <div className="ad-stat-num cream">{quotations.length}</div>
            <div className="ad-stat-lbl">Total Requests</div>
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
              {quotations.filter(q => q.eventType === 'wedding').length}
            </div>
            <div className="ad-stat-lbl">Wedding Requests</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="ad-toolbar">
          <div className="ad-toolbar-title">Quote Requests</div>
          <div className="ad-filters">
            <select className="ad-filter-input" value={filter.eventType}
              onChange={e => setFilter(p => ({ ...p, eventType: e.target.value }))}>
              <option value="">All Events</option>
              <option value="wedding">Wedding</option>
              <option value="birthday">Birthday</option>
              <option value="half-saree">Half Saree / Dothi</option>
              <option value="seemantham">Seemantham</option>
              <option value="corporate">Corporate</option>
              <option value="other">Other</option>
            </select>
            <input className="ad-filter-input" type="date" value={filter.date}
              onChange={e => setFilter(p => ({ ...p, date: e.target.value }))} />
            {(filter.eventType || filter.date) && (
              <button className="ad-btn-ghost" onClick={() => setFilter({ eventType: '', date: '' })}>
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
                        <div className="ad-cell-name">{eventLabel(q.eventType)}</div>
                        {q.subEvent && (
                          <div className="ad-cell-sub">{subEventLabel(q.subEvent)}</div>
                        )}
                        <div className="ad-cell-sub">{q.eventDate} · {q.eventLocation}</div>
                      </td>
                      <td>
                        {q.servicesByKey
                          ? Object.entries(q.servicesByKey).map(([key, svcs]) => (
                              <div key={key} className="ad-cell-sub" style={{ marginBottom: '0.2rem' }}>
                                <span style={{ color: 'var(--gold2)' }}>
                                  {key.replace(/-/g, ' ')}:
                                </span>{' '}
                                {svcs.join(', ')}
                              </div>
                            ))
                          : <div className="ad-cell-sub">{q.services?.join(' · ') || '—'}</div>
                        }
                        {q.budgetRange && (
                          <div className="ad-cell-sub" style={{ marginTop: '0.2rem' }}>
                            Budget: {q.budgetRange}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`ad-status ${q.status || 'pending'}`}>
                          {q.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        <div className="ad-cell-sub">
                          {q.submittedAt?.toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="ad-action-row">
                          {q.status !== 'contacted' && (
                            <button className="ad-tbl-btn contact"
                              onClick={() => markAsContacted(q.id)}>
                              Mark Contacted
                            </button>
                          )}
                          <button className="ad-tbl-btn"
                            onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
                            {expandedId === q.id ? 'Hide' : 'Details'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedId === q.id && (
                      <tr key={`${q.id}-detail`} className="ad-detail-row">
                        <td colSpan={6}>
                          <div className="ad-detail-inner">
                            <div className="ad-detail-grid">
                              <div>
                                <div className="ad-detail-label">Special Requests</div>
                                <div className="ad-detail-val">{q.specialRequests || 'None'}</div>
                              </div>
                              <div>
                                <div className="ad-detail-label">Reference Images</div>
                                <div className="ad-detail-val">
                                  {q.referenceImages?.length > 0
                                    ? `${q.referenceImages.length} image(s) uploaded`
                                    : 'None'}
                                </div>
                              </div>
                              <div>
                                <div className="ad-detail-label">Full Services List</div>
                                <div className="ad-detail-val">
                                  {q.servicesByKey
                                    ? Object.entries(q.servicesByKey).map(([key, svcs]) => (
                                        <div key={key} style={{ marginBottom: '0.3rem' }}>
                                          <span style={{ color: 'var(--gold2)', textTransform: 'capitalize' }}>
                                            {key.replace(/-/g, ' ')}:
                                          </span>{' '}
                                          {svcs.join(', ')}
                                        </div>
                                      ))
                                    : (q.services?.join(', ') || '—')
                                  }
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