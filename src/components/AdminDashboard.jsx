import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import emailjs from '@emailjs/browser';

const AdminDashboard = () => {
  const [user, setUser]             = useState(null);
  const [loginData, setLoginData]   = useState({ email: '', password: '' });
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState({ eventType: '', date: '', status: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [theme, setTheme]           = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    let unsubQuotes = null;

    const unsubAuth = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        unsubQuotes = onSnapshot(collection(db, 'quotations'), (snap) => {
          const quotes = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            submittedAt: d.data().submittedAt?.toDate(),
          })).sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
          setQuotations(quotes);
          setLoading(false);
        }, (err) => {
          console.error('Error fetching quotations:', err);
          setLoading(false);
        });
      } else {
        if (unsubQuotes) unsubQuotes();
        setQuotations([]);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubQuotes) unsubQuotes();
    };
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
    } catch (err) {
      console.error(err);
    }
  };

  const deleteQuotation = async (q) => {
    if (window.confirm(`Are you sure you want to reject and delete this quote request? An email will be sent to ${q.email}.`)) {
      setDeletingId(q.id);
      try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey && serviceId !== 'YOUR_SERVICE_ID') {
          const templateParams = {
            to_name: q.fullName,
            to_email: q.email,
            event_type: q.eventType === 'wedding' ? 'Wedding' : (q.eventType || 'Event')
          };
          try {
            await emailjs.send(serviceId, templateId, templateParams, publicKey);
          } catch (emailErr) {
            console.error('Failed to send rejection email:', emailErr);
            alert(`Could not send rejection email to ${q.email} (it might be invalid). The request will still be deleted.`);
          }
        } else {
          console.warn('EmailJS not configured. Quotation will be deleted without sending email.');
        }

        // Delete from Firestore
        await deleteDoc(doc(db, 'quotations', q.id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete: ' + (err?.message || err?.text || 'Unknown error'));
      } finally {
        setDeletingId(null);
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Name','Email','Phone','Event Type','Status','Submitted At','Special Requests'];
    const rows = quotations.map(q => [
      q.fullName, q.email, q.phone,
      q.eventType, q.status,
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
    if (filter.status === 'contacted' && q.status !== 'contacted') return false;
    if (filter.status === 'pending' && q.status === 'contacted') return false;
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
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <button className="ad-btn-ghost" onClick={toggleTheme} style={{ fontSize: '1.2rem', padding: '0.4rem 0.6rem' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
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
          <button className="ad-btn-ghost" onClick={toggleTheme} title="Toggle Theme" style={{ fontSize: '1.2rem', padding: '0.4rem 0.6rem' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
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
            <select className="ad-filter-input" value={filter.status || ''}
              onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
            </select>
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
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input className="ad-filter-input" type="date" value={filter.date}
                onChange={e => setFilter(p => ({ ...p, date: e.target.value }))} />
              {!filter.date && (
                <div style={{
                  position: 'absolute',
                  left: '1px',
                  right: '2rem',
                  top: '1px',
                  bottom: '1px',
                  background: 'var(--card-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '1rem',
                  color: '#777',
                  pointerEvents: 'none',
                  borderRadius: '4px 0 0 4px'
                }}>
                  Select Date
                </div>
              )}
            </div>
            {(filter.eventType || filter.date || filter.status) && (
              <button className="ad-btn-ghost" onClick={() => setFilter({ eventType: '', date: '', status: '' })}>
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
                  <th>Booked Date</th>
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
                      </td>
                      <td>
                        {q.servicesByKey
                          ? Object.keys(q.servicesByKey).map(key => (
                              <div key={key} className="ad-cell-sub" style={{ marginBottom: '0.2rem' }}>
                                <span style={{ color: 'var(--gold2)', textTransform: 'capitalize' }}>
                                  {key.replace(/-/g, ' ')}:
                                </span>{' '}
                                {q.eventDates?.[key] || 'TBD'} {q.eventTimes?.[key] ? `at ${q.eventTimes[key]}` : ''}
                              </div>
                            ))
                          : <div className="ad-cell-sub">{q.eventDate || 'TBD'} {q.eventTime ? `at ${q.eventTime}` : ''}</div>
                        }
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
                          <button className="ad-tbl-btn delete"
                            onClick={() => deleteQuotation(q)}
                            disabled={deletingId === q.id}
                            style={{ opacity: deletingId === q.id ? 0.6 : 1, cursor: deletingId === q.id ? 'not-allowed' : 'pointer' }}>
                            {deletingId === q.id ? 'Deleting...' : 'Delete'}
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
                                    ? (
                                      <div className="ad-ref-images">
                                        {q.referenceImages.map((url, i) => (
                                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="ad-ref-img-link">
                                            <img src={url} alt={`Reference ${i+1}`} className="ad-ref-img" />
                                          </a>
                                        ))}
                                      </div>
                                    )
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