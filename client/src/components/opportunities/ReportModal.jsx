import { useState } from 'react';
import { X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { REPORT_REASONS } from '../../lib/constants';
import { useToast } from '../../context/ToastContext';

export function ReportModal({ opportunityId, opportunityTitle, onClose }) {
  const { showToast } = useToast();
  const [reason, setReason] = useState('incorrect_deadline');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useSte(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      showToast('Please provide at least 10 characters explaining the issue.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reports', { opportunityId, reason, description });
      showToast('Report submitted to administrators for review.', 'success');
      onClose();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 id="report-modal-title" className="text-lg font-semibold text-slate-900">
            Report Listing Issue
          </h2>
          <button
            type="button"
            aria-label="Close report modal"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-600">Listing: {opportunityTitle}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="report-reason" className="block text-sm font-medium text-slate-700">
              Reason
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="report-description"
              className="block text-sm font-medium text-slate-700"
            >
              Details
            </label>
            <textarea
              id="report-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the incorrect deadline, broken URL, or suspicious detail..."
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

