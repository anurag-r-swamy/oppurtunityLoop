import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Bookmark,
  Calendar,
  ExternalLink,
  Flag,
  MapPin,
  ShieldCheck,
  Users,
  CheckSquare,
  ArrowLeft
} from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCategoryLabel, formatDate, formatFee } from '../../lib/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ExplanationPanel } from '../../components/opportunities/ExplanationPanel';
import { ReportModal } from '../../components/opportunities/ReportModal';

export function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/opportunities/${id}`);
      setData(res.data?.data || null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load opportunity details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleBookmark = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (data.isBookmarked) {
        await api.delete(`/opportunities/${data.opportunity._id}/bookmark`);
        setData((prev) => ({ ...prev, isBookmarked: false }));
        showToast('Removed bookmark.', 'info');
      } else {
        await api.post(`/opportunities/${data.opportunity._id}/bookmark`);
        setData((prev) => ({ ...prev, isBookmarked: true }));
        showToast('Opportunity saved!', 'success');
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const handleStartTracking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/opportunities/${data.opportunity._id}/participation`, {
        status: 'interested'
      });
      const created = res.data?.data?.participation;
      setData((prev) => ({ ...prev, participation: created }));
      showToast('Added to Participation Tracker with a preparation checklist!', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-48 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (error || !data?.opportunity) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-base font-semibold text-rose-700">{error || 'Opportunity not found.'}</p>
        <Link
          to="/opportunities"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Opportunities
        </Link>
      </div>
    );
  }

  const { opportunity: opp, isBookmarked, participation, explanation } = data;
  const rules = opp.eligibilityRules || {};

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Discovery
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-semibold text-indigo-700">
                {formatCategoryLabel(opp.category)}
              </span>
              <StatusBadge status={opp.verificationStatus} />
              <StatusBadge status={opp.publicationStatus} />
              {opp.isDemoData && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  Demo Sample Listing
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{opp.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Organized by <strong className="text-slate-900">{opp.organizerName}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBookmark}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium ${
                isBookmarked
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'} />
              {isBookmarked ? 'Saved' : 'Save'}
            </button>

            {user?.role === 'student' && !participation && (
              <button
                type="button"
                onClick={handleStartTracking}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <CheckSquare className="h-4 w-4" />
                Track & Checklist
              </button>
            )}

            {participation && (
              <Link
                to={`/student/participations/${participation._id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <CheckSquare className="h-4 w-4" />
                Open Tracker ({participation.status})
              </Link>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Registration Deadline</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Calendar className="h-4 w-4 text-indigo-600" />
              {formatDate(opp.deadline)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Event Dates</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatDate(opp.eventStartDate)} – {formatDate(opp.eventEndDate)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Mode & Location</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold capitalize text-slate-900">
              <MapPin className="h-4 w-4 text-indigo-600" />
              {opp.eventMode} ({opp.location?.city ? `${opp.location.city}, ` : ''}
              {opp.location?.state || 'All India'})
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Fee & Team Size</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Users className="h-4 w-4 text-indigo-600" />
              {formatFee(opp.feeAmount, opp.feeCurrency)} ·{' '}
              {opp.teamSize?.max > 1
                ? `${opp.teamSize.min}-${opp.teamSize.max} members`
                : 'Individual'}
            </p>
          </div>
        </div>

        {/* External Links & Verification Metadata */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-slate-100 py-4">
          <div className="flex flex-wrap gap-3">
            <a
              href={opp.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            >
              External Registration <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={opp.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Official Source <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            {opp.lastVerifiedAt && (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Last verified: {formatDate(opp.lastVerifiedAt)}
              </span>
            )}
            {user && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1 font-medium text-rose-600 hover:underline"
              >
                <Flag className="h-3.5 w-3.5" />
                Report outdated info
              </button>
            )}
          </div>
        </div>

        {/* Explainable Engine Panel */}
        {explanation && (
          <div className="mt-6">
            <ExplanationPanel explanation={explanation} />
          </div>
        )}

        {/* Description & Skills */}
        <div className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">About This Opportunity</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {opp.fullDescription}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Eligibility Requirements</h3>
              <dl className="mt-3 space-y-2 text-xs">
                <div>
                  <dt className="font-medium text-slate-500">Disciplines</dt>
                  <dd className="mt-0.5 text-slate-800">
                    {rules.openToAllDisciplines
                      ? 'Open to all academic disciplines'
                      : rules.allowedDisciplines?.length
                        ? rules.allowedDisciplines.join(', ')
                        : 'Not specified by organizer'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Degree Levels</dt>
                  <dd className="mt-0.5 text-slate-800">
                    {rules.allowedDegreeLevels?.length
                      ? rules.allowedDegreeLevels.join(', ')
                      : 'Not specified'}
                  </dd>
                </div>
                {rules.allowedYears?.length > 0 && (
                  <div>
                    <dt className="font-medium text-slate-500">Eligible Years</dt>
                    <dd className="mt-0.5 text-slate-800">
                      Year {rules.allowedYears.join(', ')}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-slate-500">Locations</dt>
                  <dd className="mt-0.5 text-slate-800">
                    {rules.allowedStates?.length
                      ? rules.allowedStates.join(', ')
                      : 'All India'}
                  </dd>
                </div>
                {rules.notes && (
                  <div>
                    <dt className="font-medium text-slate-500">Additional Notes</dt>
                    <dd className="mt-0.5 text-slate-800">{rules.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Skills & Preparation Topics
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {opp.requiredSkills?.length > 0 ? (
                  opp.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">No specific prerequisites listed.</span>
                )}
              </div>

              {opp.defaultChecklist?.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-700">
                    Recommended Preparation Checklist
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                    {opp.defaultChecklist.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {reportOpen && (
        <ReportModal
          opportunityId={opp._id}
          opportunityTitle={opp.title}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}

