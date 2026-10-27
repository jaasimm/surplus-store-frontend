import { useState } from 'react';
import { MapPin, Trash2, Star, Plus } from 'lucide-react';
import { ButtonSpinner, ErrorNote } from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api, { errMsg } from '../../api/client';
import { cx } from '../../utils/format';

const EMPTY = { name: '', phone: '', pincode: '', line1: '', line2: '', city: '', state: '', isDefault: false };

/** Saved addresses: add, edit, set default, delete. */
export default function Addresses() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | addressId
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');

  const addresses = user?.addresses || [];

  const openNew = () => {
    setForm(EMPTY);
    setErrors({});
    setApiError('');
    setEditing('new');
  };

  const openEdit = (a) => {
    setForm({ name: a.name, phone: a.phone, pincode: a.pincode, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, isDefault: a.isDefault });
    setErrors({});
    setApiError('');
    setEditing(a._id);
  };

  const validate = () => {
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter the full name';
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, '').slice(-10))) errs.phone = 'Enter a 10-digit mobile number';
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode = 'Pincode must be 6 digits';
    if (form.line1.trim().length < 4) errs.line1 = 'Enter house / street details';
    if (form.city.trim().length < 2) errs.city = 'Enter city';
    if (form.state.trim().length < 2) errs.state = 'Enter state';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setBusy(true);
    try {
      if (editing === 'new') await api.post('/users/addresses', form);
      else await api.put(`/users/addresses/${editing}`, form);
      await refreshUser();
      toast.success('Address saved');
      setEditing(null);
    } catch (err) {
      setApiError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete the address for ${a.name}?`)) return;
    try {
      await api.delete(`/users/addresses/${a._id}`);
      await refreshUser();
      toast.info('Address removed');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const makeDefault = async (a) => {
    try {
      await api.post(`/users/addresses/${a._id}/default`);
      await refreshUser();
      toast.success('Default address updated');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Saved addresses</h2>
        {editing !== 'new' && (
          <button onClick={openNew} className="btn-outline py-2 text-xs">
            <Plus className="h-4 w-4" /> Add address
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={save} className="card grid gap-4 p-5 sm:grid-cols-2">
          <ErrorNote className="sm:col-span-2">{apiError}</ErrorNote>
          <div>
            <label className="label">Full name</label>
            <input className={cx('field', errors.name && 'field-error')} value={form.name} onChange={set('name')} placeholder="Priya Sharma" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Mobile number</label>
            <input inputMode="numeric" className={cx('field', errors.phone && 'field-error')} value={form.phone} onChange={set('phone')} placeholder="9876543210" />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">House no., building, street</label>
            <input className={cx('field', errors.line1 && 'field-error')} value={form.line1} onChange={set('line1')} placeholder="B-402, Sunrise Apartments" />
            {errors.line1 && <p className="mt-1 text-xs text-red-600">{errors.line1}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Area, landmark</label>
            <input className="field" value={form.line2} onChange={set('line2')} placeholder="Near City Mall" />
          </div>
          <div>
            <label className="label">Pincode</label>
            <input inputMode="numeric" className={cx('field', errors.pincode && 'field-error')} value={form.pincode} onChange={set('pincode')} placeholder="400001" />
            {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>}
          </div>
          <div>
            <label className="label">City</label>
            <input className={cx('field', errors.city && 'field-error')} value={form.city} onChange={set('city')} placeholder="Mumbai" />
            {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
          </div>
          <div>
            <label className="label">State</label>
            <input className={cx('field', errors.state && 'field-error')} value={form.state} onChange={set('state')} placeholder="Maharashtra" />
            {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900" />
            Set as default
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={busy} className="btn-primary">{busy ? <ButtonSpinner /> : 'Save address'}</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !editing ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink-200 bg-white py-16 text-center">
          <MapPin className="h-9 w-9 text-ink-300" />
          <h3 className="mt-3 font-display text-lg font-bold">No saved addresses</h3>
          <p className="mt-1 text-sm text-ink-500">Save one to check out faster next time.</p>
          <button onClick={openNew} className="btn-primary mt-5 px-6">Add address</button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a._id} className={cx('card relative p-5', a.isDefault && 'ring-2 ring-ink-900')}>
              {a.isDefault && (
                <span className="absolute right-4 top-4 rounded-full bg-ink-900 px-2.5 py-1 text-[10px] font-bold text-sand-50">DEFAULT</span>
              )}
              <p className="font-semibold">{a.name}</p>
              <p className="text-xs text-ink-400 tabular-nums">{a.phone}</p>
              <p className="mt-2 text-sm text-ink-600">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
              <p className="text-sm text-ink-600">{a.city}, {a.state} — {a.pincode}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => openEdit(a)} className="btn-ghost px-3 py-1.5 text-xs">Edit</button>
                {!a.isDefault && (
                  <button onClick={() => makeDefault(a)} className="btn-ghost px-3 py-1.5 text-xs">
                    <Star className="h-3.5 w-3.5" /> Default
                  </button>
                )}
                <button onClick={() => remove(a)} className="btn-ghost px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
