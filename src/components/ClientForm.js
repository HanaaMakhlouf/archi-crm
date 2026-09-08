import { useRef, useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
  TABLE_CLIENTS,
} from '../constants';

export default function ClientForm({
  form,
  setForm,
  editingId,
  formError,
  setFormError,
  onCancel,
  toggleType,
  clientTypes,
  labelOptions,
  fetchClients,
}) {
  const errorRef = useRef(null);
  const formRef = useRef(null);
  const initialFormRef = useRef(JSON.stringify(form));
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Reset baseline whenever we switch records (create vs edit different client)
  useEffect(() => {
    initialFormRef.current = JSON.stringify(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== initialFormRef.current,
    [form]
  );

  const handleBack = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onCancel();
    }
  };

  useEffect(() => {
    if (formError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [formError]);

  // Returns true on success, false on validation/save error
  const { officeId } = useAuth();

  const submit = async () => {
    const fail = (msg) => { setFormError(msg); return false; };

    if (!form.name.trim() || !form.phone.trim() || !form.city.trim() || !form.gush.trim()) {
      return fail('נא למלא את כל שדות החובה המסומנים ב-*');
    }
    if (form.client_type.length === 0) {
      return fail('יש לבחור לפחות סוג לקוח אחד');
    }
    const gushNum = Number(form.gush);
    const helkaNum = form.helka ? Number(form.helka) : null;
    const migrashNum = form.migrash ? Number(form.migrash) : null;
    if (!Number.isInteger(gushNum) || gushNum <= 0) return fail('גוש חייב להיות מספר שלם חיובי');
    if (helkaNum !== null && (!Number.isInteger(helkaNum) || helkaNum <= 0)) {
      return fail('חלקה חייבת להיות מספר שלם חיובי');
    }
    if (migrashNum !== null && (!Number.isInteger(migrashNum) || migrashNum <= 0)) {
      return fail('מגרש חייב להיות מספר שלם חיובי');
    }

    setSaving(true);
    const payload = {
      label: form.label, name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim(), email: form.email.trim() || null,
      gush: gushNum, helka: helkaNum,
      migrash: migrashNum,
      notes: form.notes || null,
      client_type: form.client_type,
      type_attributes: form.type_attributes,
      ...(form.planning_data && { planning_data: form.planning_data }),
    };
    const { error } = editingId
      ? await supabase.from(TABLE_CLIENTS).update(payload).eq('id', editingId)
      : await supabase.from(TABLE_CLIENTS).insert([{ ...payload, office_id: officeId }]);
    setSaving(false);

    if (error) {
      console.error('Client save error:', error.message);
      if (error.message.includes('duplicate key') || error.message.includes('unique')) {
        setFormError('שם הלקוח כבר קיים במערכת — אנא בחר שם אחר');
      } else {
        setFormError('שגיאה בשמירת הלקוח. נסה שוב.');
      }
      return false;
    }
    fetchClients();
    onCancel();
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const handleSaveFromDialog = async () => {
    const ok = await submit();
    if (ok) setShowDiscardConfirm(false);
  };
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {editingId ? 'עריכת לקוח' : 'הוסף לקוח חדש'}
          </h1>
          <p className="page-subtitle">שדות המסומנים ב-* הם חובה</p>
        </div>

        <button
          className="btn btn-ghost"
          onClick={handleBack}
        >
          חזרה ←
        </button>
      </div>

      <form className="client-form" onSubmit={handleSubmit} ref={formRef}>
        {formError && <div className="form-error" ref={errorRef}>{formError}</div>}

        {/* ── GENERAL INFO ── */}
        <div className="form-section-title">פרטים כלליים</div>

        <div className="form-row">
          <div className="form-group">
            <label>סטטוס לקוח *</label>
            <select
              value={form.label}
              onChange={e =>
                setForm({ ...form, label: e.target.value })
              }
            >
              {labelOptions.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>שם לקוח *</label>
            <input
              type="text"
              value={form.name}
              onChange={e =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>טלפון *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => {
                const val = e.target.value;
                if (/^[+\d]*$/.test(val)) {
                  setForm({ ...form, phone: val });
                }
              }}
            />
          </div>

          <div className="form-group">
            <label>אימייל</label>
            <input
              type="email"
              value={form.email}
              onChange={e =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>
        </div>

        {/* ── PROPERTY INFO ── */}
        <div className="form-section-title">פרטי נכס</div>

        <div className="form-row">
          <div className="form-group">
            <label>עיר *</label>
            <input
              type="text"
              value={form.city}
              onChange={e =>
                setForm({ ...form, city: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>גוש *</label>
            <input
              type="text"
              value={form.gush}
              onChange={e =>
                setForm({ ...form, gush: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>חלקה</label>
            <input
              type="text"
              value={form.helka}
              onChange={e =>
                setForm({ ...form, helka: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>מגרש</label>
            <input
              type="text"
              value={form.migrash}
              onChange={e =>
                setForm({ ...form, migrash: e.target.value })
              }
            />
          </div>
        </div>

        {/* ── TYPES ── */}
        <div className="form-section-title">סוג עבודה</div>

        <div className="type-checkboxes">
          {clientTypes.map(type => (
            <label
              key={type}
              className={`type-checkbox-label ${
                form.client_type.includes(type) ? 'checked' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={form.client_type.includes(type)}
                onChange={() => toggleType(type)}
              />
              {type}
            </label>
          ))}
        </div>

        {/* ── NOTES ── */}
        <div className="form-section-title">הערות</div>
        <div className="form-group"> 
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        
        {/* ── ACTIONS ── */}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={handleBack}>
            ביטול
          </button>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'שומר...' : editingId ? 'שמור' : 'הוסף'}
          </button>
        </div>
      </form>

      {showDiscardConfirm && (
        <div className="discard-overlay">
          <div className="discard-dialog">
            <p>יש שינויים שלא נשמרו. לבטל אותם?</p>
            <div className="discard-actions">
              <button className="btn btn-ghost" disabled={saving} onClick={() => setShowDiscardConfirm(false)}>
                המשך עריכה
              </button>
              <button className="btn btn-danger" disabled={saving} onClick={onCancel}>
                בטל שינויים
              </button>
              <button className="btn btn-primary" disabled={saving} onClick={handleSaveFromDialog}>
                {saving ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}