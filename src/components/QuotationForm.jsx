import React, { useState, useCallback, useRef, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/* ══════════════════════════════════════════
   DATA — Nayanam Stories
   ══════════════════════════════════════════ */

const EVENT_TYPES = [
  { value: 'wedding',    label: 'Wedding',                icon: '💍' },
  { value: 'birthday',   label: 'Birthday',               icon: '🎂' },
  { value: 'half-saree', label: 'Half Saree / Dothi Ceremony',     icon: '🌸' },
  { value: 'seemantham', label: 'Seemantham',              icon: '🪷' },
  { value: 'corporate',  label: 'Corporate Events',       icon: '💼' },
  { value: 'other',      label: 'Other Events',           icon: '✨' },
];

const WEDDING_SUB_EVENTS = [
  { value: 'engagement',       label: 'Engagement'       },
  { value: 'pellikuthuru',     label: 'Pellikuthuru'     },
  { value: 'pellikoduku',      label: 'Pellikoduku'      },
  { value: 'haldi',            label: 'Haldi'            },
  { value: 'wedding-ceremony', label: 'Wedding Ceremony' },
  { value: 'reception',        label: 'Reception'        },
];

// Services per context
const SERVICES_MAP = {
  // Wedding sub-events
  'engagement':       [
    { value: 'traditional-photo', label: 'Traditional Photo',   icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video',   icon: '🎬' },
    { value: 'cinematic-video',   label: 'Cinematic Video',     icon: '🎥' },
    { value: 'candid-photo',      label: 'Candid Photo',        icon: '📸' },
    { value: 'drone',             label: 'Drone',               icon: '🚁' },
    { value: 'extra-services',    label: 'Extra Services',      icon: '⭐' },
  ],
  'pellikuthuru':     [
    { value: 'traditional-photo', label: 'Traditional Photo',   icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video',   icon: '🎬' },
    { value: 'cinematic-video',   label: 'Cinematic Video',     icon: '🎥' },
    { value: 'candid-photo',      label: 'Candid Photo',        icon: '📸' },
    { value: 'drone',             label: 'Drone',               icon: '🚁' },
  ],
  'pellikoduku':      [
    { value: 'traditional-photo', label: 'Traditional Photo',   icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video',   icon: '🎬' },
    { value: 'cinematic-video',   label: 'Cinematic Video',     icon: '🎥' },
    { value: 'candid-photo',      label: 'Candid Photo',        icon: '📸' },
    { value: 'drone',             label: 'Drone',               icon: '🚁' },
  ],
  'haldi':            [
    { value: 'traditional-photo', label: 'Traditional Photo',   icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video',   icon: '🎬' },
    { value: 'cinematic-video',   label: 'Cinematic Video',     icon: '🎥' },
    { value: 'candid-photo',      label: 'Candid Photo',        icon: '📸' },
    { value: 'drone',             label: 'Drone',               icon: '🚁' },
  ],
  'wedding-ceremony': [
    { value: 'traditional-photo', label: 'Traditional Photo',   icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video',   icon: '🎬' },
    { value: 'cinematic-video',   label: 'Cinematic Video',     icon: '🎥' },
    { value: 'candid-photo',      label: 'Candid Photography',  icon: '📸' },
    { value: 'drone',             label: 'Drone Coverage',      icon: '🚁' },
    { value: 'album-design',      label: 'Album Design',        icon: '📒' },
  ],
  'reception':        [
    { value: 'traditional-photo',    label: 'Traditional Photo',    icon: '📷' },
    { value: 'traditional-video',    label: 'Traditional Video',    icon: '🎬' },
    { value: 'cinematic-highlights', label: 'Cinematic Highlights', icon: '🎥' },
    { value: 'candid-photo',         label: 'Candid Photography',   icon: '📸' },
    { value: 'drone',                label: 'Drone Coverage',       icon: '🚁' },
  ],
  // Standalone events
  'birthday':   [
    { value: 'traditional-photo', label: 'Traditional Photo',   icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video',   icon: '🎬' },
    { value: 'cinematic-video',   label: 'Cinematic Video',     icon: '🎥' },
    { value: 'candid-photo',      label: 'Candid Photo',        icon: '📸' },
    { value: 'drone',             label: 'Drone',               icon: '🚁' },
  ],
  'half-saree': [
    { value: 'traditional-photo', label: 'Traditional Photo',   icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video',   icon: '🎬' },
    { value: 'cinematic-video',   label: 'Cinematic Video',     icon: '🎥' },
    { value: 'candid-photo',      label: 'Candid Photo',        icon: '📸' },
    { value: 'drone',             label: 'Drone',               icon: '🚁' },
  ],
  'seemantham': [
    { value: 'traditional-photo', label: 'Traditional Photo',   icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video',   icon: '🎬' },
    { value: 'cinematic-video',   label: 'Cinematic Video',     icon: '🎥' },
    { value: 'candid-photo',      label: 'Candid Photo',        icon: '📸' },
    { value: 'drone',             label: 'Drone',               icon: '🚁' },
  ],
  'corporate':  [
    { value: 'traditional-photo', label: 'Traditional Photo',   icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video',   icon: '🎬' },
    { value: 'cinematic-video',   label: 'Cinematic Video',     icon: '🎥' },
    { value: 'candid-photo',      label: 'Candid Photo',        icon: '📸' },
    { value: 'drone',             label: 'Drone',               icon: '🚁' },
  ],
  'other':      [
    { value: 'traditional-photo', label: 'Traditional Photo',   icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video',   icon: '🎬' },
    { value: 'cinematic-video',   label: 'Cinematic Video',     icon: '🎥' },
    { value: 'candid-photo',      label: 'Candid Photo',        icon: '📸' },
    { value: 'drone',             label: 'Drone',               icon: '🚁' },
  ],
};

const BUDGET_RANGES = [
  'Under ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹2,00,000',
  'Above ₹2,00,000',
];

const STEPS = ['Details', 'Event', 'Services', 'Review'];

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */

// servicesByKey: { [eventKey]: string[] }
// eventKey = sub-event value for wedding, or eventType for others
function hasAllServicesSelected(eventType, subEvents, servicesByKey) {
  if (eventType === 'wedding') {
    if (subEvents.length === 0) return false;
    return subEvents.every(se => (servicesByKey[se] || []).length > 0);
  }
  return (servicesByKey[eventType] || []).length > 0;
}

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */

const QuotationForm = () => {
  const [step, setStep] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '',
    eventType: '',
    subEvents: [],          // only used when eventType === 'wedding'
    eventDates: {}, eventLocations: {},  // { [eventKey]: string }
    servicesByKey: {},      // { [subEventValue OR eventType]: string[] }
    budgetRange: '',
    specialRequests: '',
    referenceImages: [],
  });
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const isWedding     = formData.eventType === 'wedding';
  const selectedEvent = EVENT_TYPES.find(e => e.value === formData.eventType);

  // For non-wedding: which keys to show services for
  // For wedding: use the subEvents array
  const serviceKeys = isWedding
    ? formData.subEvents
    : (formData.eventType ? [formData.eventType] : []);

  /* ── handlers ── */
  const handleInput = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const setEventType = value =>
    setFormData(p => ({ ...p, eventType: value, subEvents: [], servicesByKey: {}, eventDates: {}, eventLocations: {} }));

  const toggleSubEvent = value =>
    setFormData(p => {
      const next = p.subEvents.includes(value)
        ? p.subEvents.filter(s => s !== value)
        : [...p.subEvents, value];
      // Remove services for de-selected sub-event
      const nextServices = { ...p.servicesByKey };
      const nextDates = { ...p.eventDates };
      const nextLocations = { ...p.eventLocations };
      if (!next.includes(value)) {
        delete nextServices[value];
        delete nextDates[value];
        delete nextLocations[value];
      }
      return { ...p, subEvents: next, servicesByKey: nextServices, eventDates: nextDates, eventLocations: nextLocations };
    });

  const toggleService = useCallback((key, svcValue) =>
    setFormData(p => {
      const current = p.servicesByKey[key] || [];
      const updated = current.includes(svcValue)
        ? current.filter(s => s !== svcValue)
        : [...current, svcValue];
      return { ...p, servicesByKey: { ...p.servicesByKey, [key]: updated } };
    }), []);

  const setEventDate = useCallback((key, date) =>
    setFormData(p => ({ ...p, eventDates: { ...p.eventDates, [key]: date } })), []);

  const setEventLocation = useCallback((key, location) =>
    setFormData(p => ({ ...p, eventLocations: { ...p.eventLocations, [key]: location } })), []);

  const handleFileChange = e => {
    const files = Array.from(e.target.files);
    if (files.length > 5) { alert('Maximum 5 images allowed'); return; }
    setFormData(p => ({ ...p, referenceImages: files }));
  };

  const canAdvance = () => {
    if (step === 0) return formData.fullName && formData.email && formData.phone;
    if (step === 1) return formData.eventType
      && (!isWedding || formData.subEvents.length > 0);
    if (step === 2) return hasAllServicesSelected(
      formData.eventType, formData.subEvents, formData.servicesByKey
    ) && serviceKeys.every(key => formData.eventDates[key] && formData.eventLocations[key]);
    return true;
  };

  const handleSubmit = async () => {
    if (!canAdvance()) return;
    // Check all dates are not in the past
    for (const date of Object.values(formData.eventDates)) {
      if (date && new Date(date) < new Date()) {
        alert('Event date cannot be in the past'); return;
      }
    }
    setLoading(true);
    try {
      const imageUrls = await Promise.all(
        formData.referenceImages.map(async file => {
          const storRef = ref(storage, `reference-images/${Date.now()}-${file.name}`);
          await uploadBytes(storRef, file);
          return getDownloadURL(storRef);
        })
      );
      await addDoc(collection(db, 'quotations'), {
        fullName:        formData.fullName,
        email:           formData.email,
        phone:           formData.phone,
        eventType:       formData.eventType,
        subEvents:       formData.subEvents,
        eventDates:      formData.eventDates,
        eventLocations:  formData.eventLocations,
        servicesByKey:   formData.servicesByKey,
        budgetRange:     formData.budgetRange,
        specialRequests: formData.specialRequests,
        referenceImages: imageUrls,
        submittedAt:     new Date(),
        status:          'pending',
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Check = () => (
    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
      <path d="M1 3.5L3.5 6L8 1" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  /* ── ServiceBlock: reusable services selector for one event key ── */
  const ServiceBlock = React.memo(({ eventKey, title, selected, eventDate, eventLocation, onToggleService, onSetDate, onSetLocation }) => {
    const services = SERVICES_MAP[eventKey] || [];
    const dateRef = useRef();
    const locationRef = useRef();

    useEffect(() => {
      if (dateRef.current) dateRef.current.value = eventDate;
    }, [eventDate]);

    useEffect(() => {
      if (locationRef.current) locationRef.current.value = eventLocation;
    }, [eventLocation]);

    return (
      <div className="qf-svc-block">
        <div className="qf-svc-block-title">
          <span className="qf-svc-block-dot" />
          {title}
          {selected.length > 0 && (
            <span className="qf-svc-block-count">{selected.length} selected</span>
          )}
        </div>
        <div className="qf-svc-grid">
          {services.map(svc => {
            const checked = selected.includes(svc.value);
            return (
              <div key={svc.value}
                className={`qf-svc-card${checked ? ' checked' : ''}`}
                onClick={() => onToggleService(eventKey, svc.value)}>
                <div className={`qf-svc-box${checked ? ' checked' : ''}`}>
                  {checked && <Check />}
                </div>
                <div className="qf-svc-info">
                  <span className="qf-svc-icon">{svc.icon}</span>
                  <div className="qf-svc-name">{svc.label}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="qf-grid-2" style={{ marginTop: '1rem' }}>
          <div className="qf-field">
            <label className="qf-label">Event Date *</label>
            <input className="qf-input" type="date" ref={dateRef}
              onBlur={() => onSetDate(eventKey, dateRef.current.value)} />
          </div>
          <div className="qf-field">
            <label className="qf-label">Event Location *</label>
            <input className="qf-input" type="text" ref={locationRef}
              onBlur={() => onSetLocation(eventKey, locationRef.current.value)}
              placeholder="City, State" />
          </div>
        </div>
      </div>
    );
  });

  /* ── SUCCESS ── */
  if (submitted) {
    return (
      <div className="qf-success-page">
        <div className="qf-success-card">
          <div className="qf-success-icon">
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <path d="M2 8L8.5 14L20 2" stroke="#97c459" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="qf-success-brand">Nayanam Stories</div>
          <h2 className="qf-success-title">Thank You!</h2>
          <p className="qf-success-body">
            Thank you for choosing Nayanam Stories.<br/>
            Let’s create beautiful memories together.
          </p>
          <button className="qf-btn-ghost" onClick={() => window.location.reload()}>
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  /* ── FORM ── */
  return (
    <div className="qf-page">
      <div className="qf-hero">
        <button className="qf-theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="qf-eyebrow">Welcome to Nayanam Stories</div>
        <h1 className="qf-hero-title">Nayanam <em>Stories</em></h1>
        <p className="qf-hero-sub">Creative Wedding &amp; Event Photography<br/>Choose your event and build your photography package.</p>
      </div>

      <div className="qf-wrap">
        <div className="qf-card">

          <div className="qf-step-track">
            {STEPS.map((s, i) => (
              <div key={s}
                className={`qf-step-tab${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
                {String(i + 1).padStart(2, '0')} · {s}
              </div>
            ))}
          </div>

          <div className="qf-body">

            {/* ── STEP 0: Details ── */}
            {step === 0 && (
              <>
                <h2 className="qf-section-title">Your Details</h2>
                <div className="qf-section-sub">01 of 04 · Contact information</div>
                <div className="qf-grid-2">
                  <div className="qf-field">
                    <label className="qf-label">Full Name *</label>
                    <input className="qf-input" type="text" name="fullName"
                      value={formData.fullName} onChange={handleInput} placeholder="Your full name" />
                  </div>
                  <div className="qf-field">
                    <label className="qf-label">Email Address *</label>
                    <input className="qf-input" type="email" name="email"
                      value={formData.email} onChange={handleInput} placeholder="you@example.com" />
                  </div>
                </div>
                <div className="qf-grid-1">
                  <div className="qf-field">
                    <label className="qf-label">Phone Number *</label>
                    <input className="qf-input" type="tel" name="phone"
                      value={formData.phone} onChange={handleInput} placeholder="+91 98765 43210" />
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 1: Event ── */}
            {step === 1 && (
              <>
                <h2 className="qf-section-title">Select Your Event</h2>
                <div className="qf-section-sub">02 of 04 · Choose event type</div>

                <div className="qf-event-cards">
                  {EVENT_TYPES.map(ev => (
                    <div key={ev.value}
                      className={`qf-event-card${formData.eventType === ev.value ? ' selected' : ''}`}
                      onClick={() => setEventType(ev.value)}>
                      <span className="qf-event-icon">{ev.icon}</span>
                      <div className="qf-event-name">{ev.label}</div>
                    </div>
                  ))}
                </div>

                {/* Wedding sub-event multi-select */}
                {isWedding && (
                  <div className="qf-subevent-section">
                    <div className="qf-label" style={{ marginBottom: '0.4rem' }}>
                      Choose Wedding Events *
                    </div>
                    <div className="qf-subevent-hint">Select all that apply — each will get its own services in the next step</div>
                    <div className="qf-subevent-grid">
                      {WEDDING_SUB_EVENTS.map(se => (
                        <div key={se.value}
                          className={`qf-subevent-pill${formData.subEvents.includes(se.value) ? ' selected' : ''}`}
                          onClick={() => toggleSubEvent(se.value)}>
                          {formData.subEvents.includes(se.value) && (
                            <span className="qf-subevent-check">✓ </span>
                          )}
                          {se.label}
                        </div>
                      ))}
                    </div>
                    {formData.subEvents.length > 0 && (
                      <div className="qf-subevent-count">
                        {formData.subEvents.length} event{formData.subEvents.length > 1 ? 's' : ''} selected
                      </div>
                    )}
                  </div>
                )}

              </>
            )}

            {/* ── STEP 2: Services — one block per event/sub-event ── */}
            {step === 2 && (
              <>
                <h2 className="qf-section-title">Select Services</h2>
                <div className="qf-section-sub">
                  03 of 04 · Choose services for each event
                  {serviceKeys.length > 1 && ` · ${serviceKeys.length} events`}
                </div>

                {serviceKeys.map(key => {
                  const label = isWedding
                    ? WEDDING_SUB_EVENTS.find(s => s.value === key)?.label
                    : selectedEvent?.label;
                  const selected = formData.servicesByKey[key] || [];
                  const eventDate = formData.eventDates[key] || '';
                  const eventLocation = formData.eventLocations[key] || '';
                  return (
                    <ServiceBlock key={key} eventKey={key} title={label || key} selected={selected} eventDate={eventDate} eventLocation={eventLocation} onToggleService={toggleService} onSetDate={setEventDate} onSetLocation={setEventLocation} />
                  );
                })}

                <div className="qf-field" style={{ marginTop: '1.75rem' }}>
                  <label className="qf-label">Budget Range</label>
                  <select className="qf-input" name="budgetRange"
                    value={formData.budgetRange} onChange={handleInput}>
                    <option value="">Select your budget</option>
                    {BUDGET_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* ── STEP 3: Review ── */}
            {step === 3 && (
              <>
                <h2 className="qf-section-title">Review &amp; Submit</h2>
                <div className="qf-section-sub">04 of 04 · Confirm your package</div>

                <div className="qf-price-panel">
                  <div className="qf-price-panel-title">Your Package Summary</div>
                  <div className="qf-price-row">
                    <span>Name</span><span>{formData.fullName}</span>
                  </div>
                  <div className="qf-price-row">
                    <span>Contact</span><span>{formData.phone}</span>
                  </div>
                  <div className="qf-price-row">
                    <span>Event</span>
                    <span>
                      {selectedEvent?.icon} {selectedEvent?.label}
                      {formData.subEvents.length > 0 && (
                        <span style={{ display: 'block', color: 'var(--gold2)', fontSize: '0.8rem', marginTop: '0.25rem', lineHeight: 1.6 }}>
                          {formData.subEvents.map(v =>
                            WEDDING_SUB_EVENTS.find(s => s.value === v)?.label
                          ).join(' · ')}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Services per key */}
                  {serviceKeys.map(key => {
                    const keyLabel = isWedding
                      ? WEDDING_SUB_EVENTS.find(s => s.value === key)?.label
                      : selectedEvent?.label;
                    const svcList = formData.servicesByKey[key] || [];
                    const svcLabels = svcList.map(sv =>
                      (SERVICES_MAP[key] || []).find(s => s.value === sv)?.label
                    ).filter(Boolean);
                    return (
                      <div key={key} className="qf-price-row">
                        <span>{keyLabel}</span>
                        <span className="qf-price-services">
                          {svcLabels.join(' · ')}
                          <br />
                          <small style={{ color: 'var(--gold2)' }}>
                            {formData.eventDates[key]} · {formData.eventLocations[key]}
                          </small>
                        </span>
                      </div>
                    );
                  })}

                  {formData.budgetRange && (
                    <div className="qf-price-row">
                      <span>Budget</span><span>{formData.budgetRange}</span>
                    </div>
                  )}
                </div>

                <div className="qf-divider" />

                <div className="qf-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="qf-label">Special Requests</label>
                  <textarea className="qf-input qf-textarea" name="specialRequests"
                    value={formData.specialRequests} onChange={handleInput}
                    rows={4}
                    placeholder="Any special requirements, preferred styles, or notes for our team…" />
                </div>

                <div className="qf-field" style={{ marginBottom: '1.75rem' }}>
                  <label className="qf-label">
                    Reference Images <span className="qf-label-opt">(optional)</span>
                  </label>
                  <label className="qf-file-zone">
                    <span className="qf-file-label">Upload inspiration shots</span>
                    <span className="qf-file-sub">
                      {formData.referenceImages.length > 0
                        ? `${formData.referenceImages.length} file(s) selected`
                        : 'Up to 5 images · JPG, PNG, WEBP'}
                    </span>
                    <input type="file" multiple accept="image/*"
                      onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>

                <button className="qf-btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Submitting…' : 'Send My Quote Request →'}
                </button>
              </>
            )}

            {/* Nav */}
            <div className="qf-nav-row">
              {step > 0
                ? <button className="qf-btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
                : <span />
              }
              <span className="qf-step-indicator">Step {step + 1} of {STEPS.length}</span>
              {step < STEPS.length - 1 && (
                <button
                  className={`qf-btn-ghost${canAdvance() ? '' : ' disabled'}`}
                  onClick={() => { if (canAdvance()) setStep(s => s + 1); }}>
                  Next →
                </button>
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