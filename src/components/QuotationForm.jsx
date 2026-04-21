import React, { useState, useCallback, useRef, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', icon: '💍' },
  { value: 'birthday', label: 'Birthday', icon: '🎂' },
  { value: 'half-saree', label: 'Half Saree / Dothi Ceremony', icon: '🌸' },
  { value: 'seemantham', label: 'Seemantham', icon: '🪷' },
  { value: 'corporate', label: 'Corporate Events', icon: '💼' },
  { value: 'other', label: 'Other Events', icon: '✨' },
];

const WEDDING_SUB_EVENTS = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'pellikuthuru', label: 'Pellikuthuru' },
  { value: 'pellikoduku', label: 'Pellikoduku' },
  { value: 'haldi', label: 'Haldi' },
  { value: 'wedding-ceremony', label: 'Wedding Ceremony' },
  { value: 'reception', label: 'Reception' },
];

const SERVICES_MAP = {
  'engagement': [
    { value: 'traditional-photo', label: 'Traditional Photo', icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video', icon: '🎬' },
    { value: 'cinematic-video', label: 'Cinematic Video', icon: '🎥' },
    { value: 'candid-photo', label: 'Candid Photo', icon: '📸' },
    { value: 'drone', label: 'Drone', icon: '🚁' },
    { value: 'extra-services', label: 'Extra Services', icon: '⭐' },
  ],
  'pellikuthuru': [
    { value: 'traditional-photo', label: 'Traditional Photo', icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video', icon: '🎬' },
    { value: 'cinematic-video', label: 'Cinematic Video', icon: '🎥' },
    { value: 'candid-photo', label: 'Candid Photo', icon: '📸' },
    { value: 'drone', label: 'Drone', icon: '🚁' },
  ],
  'pellikoduku': [
    { value: 'traditional-photo', label: 'Traditional Photo', icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video', icon: '🎬' },
    { value: 'cinematic-video', label: 'Cinematic Video', icon: '🎥' },
    { value: 'candid-photo', label: 'Candid Photo', icon: '📸' },
    { value: 'drone', label: 'Drone', icon: '🚁' },
  ],
  'haldi': [
    { value: 'traditional-photo', label: 'Traditional Photo', icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video', icon: '🎬' },
    { value: 'cinematic-video', label: 'Cinematic Video', icon: '🎥' },
    { value: 'candid-photo', label: 'Candid Photo', icon: '📸' },
    { value: 'drone', label: 'Drone', icon: '🚁' },
  ],
  'wedding-ceremony': [
    { value: 'traditional-photo', label: 'Traditional Photo', icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video', icon: '🎬' },
    { value: 'cinematic-video', label: 'Cinematic Video', icon: '🎥' },
    { value: 'candid-photo', label: 'Candid Photography', icon: '📸' },
    { value: 'drone', label: 'Drone Coverage', icon: '🚁' },
    { value: 'album-design', label: 'Album Design', icon: '📒' },
  ],
  'reception': [
    { value: 'traditional-photo', label: 'Traditional Photo', icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video', icon: '🎬' },
    { value: 'cinematic-highlights', label: 'Cinematic Highlights', icon: '🎥' },
    { value: 'candid-photo', label: 'Candid Photography', icon: '📸' },
    { value: 'drone', label: 'Drone Coverage', icon: '🚁' },
  ],
  // Standalone events
  'birthday': [
    { value: 'traditional-photo', label: 'Traditional Photo', icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video', icon: '🎬' },
    { value: 'cinematic-video', label: 'Cinematic Video', icon: '🎥' },
    { value: 'candid-photo', label: 'Candid Photo', icon: '📸' },
    { value: 'drone', label: 'Drone', icon: '🚁' },
  ],
  'half-saree': [
    { value: 'traditional-photo', label: 'Traditional Photo', icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video', icon: '🎬' },
    { value: 'cinematic-video', label: 'Cinematic Video', icon: '🎥' },
    { value: 'candid-photo', label: 'Candid Photo', icon: '📸' },
    { value: 'drone', label: 'Drone', icon: '🚁' },
  ],
  'seemantham': [
    { value: 'traditional-photo', label: 'Traditional Photo', icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video', icon: '🎬' },
    { value: 'cinematic-video', label: 'Cinematic Video', icon: '🎥' },
    { value: 'candid-photo', label: 'Candid Photo', icon: '📸' },
    { value: 'drone', label: 'Drone', icon: '🚁' },
  ],
  'corporate': [
    { value: 'traditional-photo', label: 'Traditional Photo', icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video', icon: '🎬' },
    { value: 'cinematic-video', label: 'Cinematic Video', icon: '🎥' },
    { value: 'candid-photo', label: 'Candid Photo', icon: '📸' },
    { value: 'drone', label: 'Drone', icon: '🚁' },
  ],
  'other': [
    { value: 'traditional-photo', label: 'Traditional Photo', icon: '📷' },
    { value: 'traditional-video', label: 'Traditional Video', icon: '🎬' },
    { value: 'cinematic-video', label: 'Cinematic Video', icon: '🎥' },
    { value: 'candid-photo', label: 'Candid Photo', icon: '📸' },
    { value: 'drone', label: 'Drone', icon: '🚁' },
  ],
};

const STEPS = ['Details', 'Event', 'Services', 'Review'];

function hasAllServicesSelected(eventType, subEvents, servicesByKey) {
  if (eventType === 'wedding') {
    if (subEvents.length === 0) return false;
    return subEvents.every(se => (servicesByKey[se] || []).length > 0);
  }
  return (servicesByKey[eventType] || []).length > 0;
}


const QuotationForm = () => {
  const [step, setStep] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '',
    eventType: '',
    subEvents: [],
    eventDates: {}, eventTimes: {},
    servicesByKey: {},
    specialRequests: '',
    referenceImages: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const isWedding = formData.eventType === 'wedding';
  const selectedEvent = EVENT_TYPES.find(e => e.value === formData.eventType);

  const serviceKeys = isWedding
    ? formData.subEvents
    : (formData.eventType ? [formData.eventType] : []);

  const handleInput = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const setEventType = value =>
    setFormData(p => ({ ...p, eventType: value, subEvents: [], servicesByKey: {}, eventDates: {}, eventTimes: {} }));

  const toggleSubEvent = value =>
    setFormData(p => {
      const next = p.subEvents.includes(value)
        ? p.subEvents.filter(s => s !== value)
        : [...p.subEvents, value];
      // Remove services for de-selected sub-event
      const nextServices = { ...p.servicesByKey };
      const nextDates = { ...p.eventDates };
      const nextTimes = { ...p.eventTimes };
      if (!next.includes(value)) {
        delete nextServices[value];
        delete nextDates[value];
        delete nextTimes[value];
      }
      return { ...p, subEvents: next, servicesByKey: nextServices, eventDates: nextDates, eventTimes: nextTimes };
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

  const setEventTime = useCallback((key, time) =>
    setFormData(p => ({ ...p, eventTimes: { ...p.eventTimes, [key]: time } })), []);

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
    ) && serviceKeys.every(key => formData.eventDates[key] && formData.eventTimes[key]);
    return true;
  };

  const handleSubmit = async () => {
    if (!canAdvance()) return;
    for (const date of Object.values(formData.eventDates)) {
      if (date && new Date(date) < new Date()) {
        alert('Event date cannot be in the past'); return;
      }
    }
    setLoading(true);
    try {
      const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      const imageUrls = await Promise.all(
        formData.referenceImages.map(async file => {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('upload_preset', UPLOAD_PRESET);

          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: fd,
          });

          if (!res.ok) {
            throw new Error('Failed to upload image to Cloudinary');
          }

          const data = await res.json();
          return data.secure_url;
        })
      );

      await addDoc(collection(db, 'quotations'), {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        eventType: formData.eventType,
        subEvents: formData.subEvents,
        eventDates: formData.eventDates,
        eventTimes: formData.eventTimes,
        servicesByKey: formData.servicesByKey,
        specialRequests: formData.specialRequests,
        referenceImages: imageUrls,
        submittedAt: new Date(),
        status: 'pending',
      });

      // Auto-download PDF on success
      generatePDF();

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(184, 146, 74); // Gold
    doc.text('Nayanam Stories - Quote Request', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Name: ${formData.fullName}`, 14, 34);
    doc.text(`Phone: ${formData.phone}`, 14, 40);
    doc.text(`Email: ${formData.email}`, 14, 46);

    const eventName = EVENT_TYPES.find(e => e.value === formData.eventType)?.label || formData.eventType;
    doc.text(`Event Category: ${eventName}`, 14, 56);

    let y = 66;

    const tableData = [];
    serviceKeys.forEach(key => {
      const keyLabel = isWedding
        ? WEDDING_SUB_EVENTS.find(s => s.value === key)?.label
        : EVENT_TYPES.find(e => e.value === key)?.label || key;

      const svcs = formData.servicesByKey[key] || [];
      const svcLabels = svcs.map(sv => (SERVICES_MAP[key] || []).find(s => s.value === sv)?.label).filter(Boolean).join(', ');

      const date = formData.eventDates[key] || 'N/A';
      const time = formData.eventTimes[key] || 'N/A';

      tableData.push([keyLabel || key, svcLabels || 'None', date, time]);
    });

    autoTable(doc, {
      startY: y,
      head: [['Event / Sub-Event', 'Services Required', 'Date', 'Time']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [184, 146, 74] }, // Nayanam Gold
      styles: { fontSize: 10 }
    });

    const finalY = doc.lastAutoTable.finalY || y;

    if (formData.specialRequests) {
      doc.setFontSize(12);
      doc.setTextColor(184, 146, 74);
      doc.text('Special Requests:', 14, finalY + 12);

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const splitText = doc.splitTextToSize(formData.specialRequests, 180);
      doc.text(splitText, 14, finalY + 18);
    }

    doc.save(`Nayanam_Quote_${formData.fullName.replace(/\s+/g, '_')}.pdf`);
  };

  const Check = () => (
    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
      <path d="M1 3.5L3.5 6L8 1" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  /* ── ServiceBlock: reusable services selector for one event key ── */
  const ServiceBlock = React.memo(({ eventKey, title, selected, eventDate, eventTime, onToggleService, onSetDate, onSetTime }) => {
    const services = SERVICES_MAP[eventKey] || [];
    const dateRef = useRef();
    const timeRef = useRef();

    useEffect(() => {
      if (dateRef.current) dateRef.current.value = eventDate;
    }, [eventDate]);

    useEffect(() => {
      if (timeRef.current) timeRef.current.value = eventTime;
    }, [eventTime]);

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
              onChange={() => onSetDate(eventKey, dateRef.current.value)} />
          </div>
          <div className="qf-field">
            <label className="qf-label">Event Time *</label>
            <input className="qf-input" type="time" ref={timeRef}
              onChange={() => onSetTime(eventKey, timeRef.current.value)}
              placeholder="HH:MM" />
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
              <path d="M2 8L8.5 14L20 2" stroke="#97c459" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="qf-success-brand">Nayanam Stories</div>
          <h2 className="qf-success-title">Thank You!</h2>
          <p className="qf-success-body">
            Thank you for choosing Nayanam Stories.<br />
            Let’s create beautiful memories together.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="qf-btn-primary" onClick={generatePDF}>
              Download Quote PDF
            </button>
            <button className="qf-btn-ghost" onClick={() => window.location.reload()}>
              Submit Another Request
            </button>
          </div>
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
        <p className="qf-hero-sub">Creative Wedding &amp; Event Photography<br />Choose your event and build your photography package.</p>
        <div className="qf-hero-links">
          <a href="https://harikrishnamamidala146.wfolio.pro/disk/portfolio" target="_blank" rel="noopener noreferrer">Portfolio</a>
          <a href="https://www.instagram.com/nayanam.stories?igsh=bDM2YnB0aGYyNWt1" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
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
                      value={formData.email} onChange={handleInput} placeholder="you@example.com" required />
                  </div>
                </div>
                <div className="qf-grid-1">
                  <div className="qf-field">
                    <label className="qf-label">Phone Number *</label>
                    <input className="qf-input" type="tel" name="phone"
                      required value={formData.phone} maxLength={10} onChange={handleInput} placeholder="+91 98765 43210" />
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
                  const eventTime = formData.eventTimes[key] || '';
                  return (
                    <ServiceBlock key={key} eventKey={key} title={label || key} selected={selected} eventDate={eventDate} eventTime={eventTime} onToggleService={toggleService} onSetDate={setEventDate} onSetTime={setEventTime} />
                  );
                })}

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
                            {formData.eventDates[key]} · {formData.eventTimes[key]}
                          </small>
                        </span>
                      </div>
                    );
                  })}
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