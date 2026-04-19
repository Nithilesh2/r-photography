import { useState, useMemo, useCallback } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const eventTypes = [
  { value: 'wedding',     label: 'Wedding',        icon: '💍', basePrice: 50000 },
  { value: 'pre-wedding', label: 'Pre-Wedding',     icon: '🌹', basePrice: 20000 },
  { value: 'birthday',    label: 'Birthday',        icon: '🎂', basePrice: 15000 },
  { value: 'corporate',   label: 'Corporate',       icon: '💼', basePrice: 25000 },
  { value: 'others',      label: 'Others',          icon: '✨', basePrice: 10000 },
];

const services = [
  { value: 'photography', label: 'Photography',  price: 10000 },
  { value: 'videography', label: 'Videography',  price: 15000 },
  { value: 'drone',       label: 'Drone Shoot',  price: 8000  },
  { value: 'album',       label: 'Album Design', price: 5000  },
];

const durations = [
  { value: 'half-day',  label: 'Half Day',  multiplier: 1   },
  { value: 'full-day',  label: 'Full Day',  multiplier: 1.5 },
  { value: 'multi-day', label: 'Multi-Day', multiplier: 2.5 },
];

const budgetRanges = [
  'Under ₹25,000',
  '₹25,000 - ₹50,000',
  '₹50,000 - ₹1,00,000',
  'Above ₹1,00,000',
];

const STEPS = ['Details', 'Event', 'Services', 'Review'];

const QuotationForm = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    eventLocation: '',
    services: [],
    duration: '',
    budgetRange: '',
    specialRequests: '',
    referenceImages: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const calculatePrice = useCallback(() => {
    const evType = eventTypes.find(et => et.value === formData.eventType);
    if (!evType) return 0;
    let base = evType.basePrice;
    const svcCost = formData.services.reduce((t, s) => {
      const found = services.find(x => x.value === s);
      return t + (found ? found.price : 0);
    }, 0);
    const dur = durations.find(d => d.value === formData.duration);
    const mult = dur ? dur.multiplier : 1;
    let total = (base + svcCost) * mult;
    if (formData.eventLocation) {
      const loc = formData.eventLocation.toLowerCase();
      if (!loc.includes('hyderabad')) total += loc.includes('telangana') ? 3000 : 8000;
    }
    if (formData.eventDate) {
      const day = new Date(formData.eventDate).getDay();
      if (day === 0 || day === 6) total *= 1.1;
    }
    if (formData.services.length >= 3) total *= 0.9;
    if (formData.eventDate) {
      const month = new Date(formData.eventDate).getMonth() + 1;
      if ([11, 12, 1].includes(month)) total *= 1.2;
    }
    return Math.round(total);
  }, [formData]);

  const estimatedPrice = useMemo(() => calculatePrice(), [calculatePrice]);

  const handleInput = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleServiceToggle = svc => {
    setFormData(p => ({
      ...p,
      services: p.services.includes(svc)
        ? p.services.filter(s => s !== svc)
        : [...p.services, svc],
    }));
  };

  const handleFileChange = e => {
    const files = Array.from(e.target.files);
    if (files.length > 5) { alert('Max 5 images allowed'); return; }
    setFormData(p => ({ ...p, referenceImages: files }));
  };

  const handleSubmit = async () => {
    if (formData.services.length === 0) { alert('Select at least one service'); return; }
    if (new Date(formData.eventDate) < new Date()) { alert('Event date cannot be in the past'); return; }
    setLoading(true);
    try {
      const imageUrls = await Promise.all(
        formData.referenceImages.map(async file => {
          const storageRef = ref(storage, `reference-images/${Date.now()}-${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        })
      );
      await addDoc(collection(db, 'quotations'), {
        ...formData,
        referenceImages: imageUrls,
        estimatedPrice,
        submittedAt: new Date(),
        status: 'pending',
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success ── */
  if (submitted) {
    return (
      <div className="qf-success-page">
        <div className="qf-success-card">
          <div className="qf-success-icon">
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <path d="M2 8L8.5 14L20 2" stroke="#97c459" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="qf-success-title">Quote Submitted</h2>
          <p className="qf-success-body">
            Thank you for reaching out. We'll review your requirements and send a detailed proposal within 24 hours.
          </p>
          <button className="qf-btn-ghost" onClick={() => window.location.reload()}>
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  /* ── Checkmark SVG ── */
  const Check = () => (
    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
      <path d="M1 3.5L3.5 6L8 1" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="qf-page">

      {/* ── Hero ── */}
      <div className="qf-hero">
        <div className="qf-eyebrow">Premium Photography · Hyderabad</div>
        <h1 className="qf-hero-title">
          Capture Your<br /><em>Perfect Moment</em>
        </h1>
        <p className="qf-hero-sub">
          Tell us about your event and we'll craft a personalised quote within 24 hours.
        </p>
      </div>

      {/* ── Form card ── */}
      <div className="qf-wrap">
        <div className="qf-card">

          {/* Step track */}
          <div className="qf-step-track">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`qf-step-tab${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
              >
                {String(i + 1).padStart(2, '0')} · {s}
              </div>
            ))}
          </div>

          <div className="qf-body">

            {/* ── STEP 0: Basic Details ── */}
            {step === 0 && (
              <>
                <h2 className="qf-section-title">Basic Details</h2>
                <div className="qf-section-sub">01 of 04 · Your contact information</div>
                <div className="qf-grid-2">
                  <div className="qf-field">
                    <label className="qf-label">Full Name *</label>
                    <input className="qf-input" type="text" name="fullName"
                      value={formData.fullName} onChange={handleInput} required placeholder="Your full name" />
                  </div>
                  <div className="qf-field">
                    <label className="qf-label">Email Address *</label>
                    <input className="qf-input" type="email" name="email"
                      value={formData.email} onChange={handleInput} required placeholder="you@example.com" />
                  </div>
                </div>
                <div className="qf-grid-1">
                  <div className="qf-field">
                    <label className="qf-label">Phone Number *</label>
                    <input className="qf-input" type="tel" name="phone" maxLength={10}
                      value={formData.phone} onChange={handleInput} required placeholder="+91 98765 43210" />
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 1: Event Details ── */}
            {step === 1 && (
              <>
                <h2 className="qf-section-title">Event Details</h2>
                <div className="qf-section-sub">02 of 04 · Tell us about your event</div>

                <div className="qf-label" style={{ marginBottom: '0.75rem' }}>Event Type *</div>
                <div className="qf-event-cards">
                  {eventTypes.map(et => (
                    <div
                      key={et.value}
                      className={`qf-event-card${formData.eventType === et.value ? ' selected' : ''}`}
                      onClick={() => setFormData(p => ({ ...p, eventType: et.value }))}
                    >
                      <span className="qf-event-icon">{et.icon}</span>
                      <div className="qf-event-name">{et.label}</div>
                      <div className="qf-event-price">from ₹{(et.basePrice / 1000).toFixed(0)}k</div>
                    </div>
                  ))}
                </div>

                <div className="qf-grid-2" style={{ marginTop: '1.5rem' }}>
                  <div className="qf-field">
                    <label className="qf-label">Event Date *</label>
                    <input className="qf-input" type="date" name="eventDate"
                      value={formData.eventDate} onChange={handleInput} required />
                  </div>
                  <div className="qf-field">
                    <label className="qf-label">Event Location *</label>
                    <input className="qf-input" type="text" name="eventLocation"
                      value={formData.eventLocation} onChange={handleInput} required placeholder="City, State" />
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 2: Services ── */}
            {step === 2 && (
              <>
                <h2 className="qf-section-title">Photography Requirements</h2>
                <div className="qf-section-sub">03 of 04 · Select services · 3+ services get 10% off</div>

                <div className="qf-label" style={{ marginBottom: '0.75rem' }}>Services Required *</div>
                <div className="qf-svc-grid">
                  {services.map(svc => {
                    const checked = formData.services.includes(svc.value);
                    return (
                      <div
                        key={svc.value}
                        className={`qf-svc-card${checked ? ' checked' : ''}`}
                        onClick={() => handleServiceToggle(svc.value)}
                      >
                        <div className={`qf-svc-box${checked ? ' checked' : ''}`}>
                          {checked && <Check />}
                        </div>
                        <div className="qf-svc-info">
                          <div className="qf-svc-name">{svc.label}</div>
                          <div className="qf-svc-price">+₹{svc.price.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="qf-label" style={{ margin: '1.5rem 0 0.75rem' }}>Duration *</div>
                <div className="qf-dur-pills">
                  {durations.map(d => (
                    <div
                      key={d.value}
                      className={`qf-dur-pill${formData.duration === d.value ? ' selected' : ''}`}
                      onClick={() => setFormData(p => ({ ...p, duration: d.value }))}
                    >
                      {d.label} · ×{d.multiplier}
                    </div>
                  ))}
                </div>

                <div className="qf-field" style={{ marginTop: '1.5rem' }}>
                  <label className="qf-label">Budget Range</label>
                  <select className="qf-input" name="budgetRange"
                    value={formData.budgetRange} onChange={handleInput}>
                    <option value="">Select your budget</option>
                    {budgetRanges.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* ── STEP 3: Review + Price ── */}
            {step === 3 && (
              <>
                <h2 className="qf-section-title">Review & Submit</h2>
                <div className="qf-section-sub">04 of 04 · Your live quote estimate</div>

                {/* Price panel */}
                <div className="qf-price-panel">
                  <div className="qf-price-panel-title">Live Quote Estimate</div>
                  <div className="qf-price-row">
                    <span>Event Type</span>
                    <span>{eventTypes.find(e => e.value === formData.eventType)?.label || '—'}</span>
                  </div>
                  <div className="qf-price-row">
                    <span>Services</span>
                    <span>{formData.services.length > 0 ? formData.services.join(', ') : '—'}</span>
                  </div>
                  <div className="qf-price-row">
                    <span>Duration</span>
                    <span>{durations.find(d => d.value === formData.duration)?.label || '—'}</span>
                  </div>
                  <div className="qf-price-row">
                    <span>Location</span>
                    <span>{formData.eventLocation || '—'}</span>
                  </div>
                  {formData.services.length >= 3 && (
                    <div className="qf-price-row">
                      <span>Bundle Discount</span>
                      <span style={{ color: '#97c459' }}>–10%</span>
                    </div>
                  )}
                  <div className="qf-price-row total">
                    <span>Total Estimate</span>
                    <span className="qf-price-total">₹{estimatedPrice.toLocaleString()}</span>
                  </div>
                  <div className="qf-badge-row">
                    {formData.eventLocation?.toLowerCase().includes('hyderabad') && (
                      <span className="qf-badge green">No travel surcharge</span>
                    )}
                    {formData.services.length >= 3 && (
                      <span className="qf-badge green">10% bundle discount applied</span>
                    )}
                    {formData.eventDate && [11, 12, 1].includes(new Date(formData.eventDate).getMonth() + 1) && (
                      <span className="qf-badge amber">Peak season +20%</span>
                    )}
                    {formData.eventDate && [0, 6].includes(new Date(formData.eventDate).getDay()) && (
                      <span className="qf-badge amber">Weekend +10%</span>
                    )}
                  </div>
                </div>

                <div className="qf-divider" />

                <div className="qf-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="qf-label">Special Requests</label>
                  <textarea className="qf-input qf-textarea" name="specialRequests"
                    value={formData.specialRequests} onChange={handleInput}
                    rows={4} placeholder="Any notes, inspirations, or special requirements…" />
                </div>

                <div className="qf-field" style={{ marginBottom: '1.5rem' }}>
                  <label className="qf-label">Reference Images</label>
                  <label className="qf-file-zone">
                    <span className="qf-file-label">Upload inspiration</span>
                    <span className="qf-file-sub">
                      {formData.referenceImages.length > 0
                        ? `${formData.referenceImages.length} file(s) selected`
                        : 'Up to 5 images · JPG, PNG, WEBP'}
                    </span>
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>

                <button
                  className="qf-btn-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Submitting…' : 'Get My Quote →'}
                </button>
              </>
            )}

            {/* ── Navigation ── */}
            <div className="qf-nav-row">
              {step > 0
                ? <button className="qf-btn-ghost" onClick={() => setStep(s => s - 1)}>← Previous</button>
                : <span />
              }
              <span className="qf-step-indicator">Step {step + 1} of {STEPS.length}</span>
              {step < STEPS.length - 1 && (
                <button className="qf-btn-ghost" onClick={() => setStep(s => s + 1)}>Next →</button>
              )}
              {step === STEPS.length - 1 && <span />}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationForm;