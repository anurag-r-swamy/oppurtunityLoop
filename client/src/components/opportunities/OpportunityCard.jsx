import { Link } from 'react-router-dom';
import { Bookmark, Calendar, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { formatCategoryLabel, formatDeadlineCountdown, formatFee } from '../../lib/formatters';
import { StatusBadge } from '../common/StatusBadge';

export function OpportunityCard({
  opportunity,
  explanation,
  onToggleBookmark,
  showBookmark = true
}) {
  const summary = explanation || opportunity.matchSummary;
  const countdown = formatDeadlineCountdown(opportunity.deadline);

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-200 hover:shadow-md">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {formatCategoryLabel(opportunity.category)}
            </span>
            {opportunity.isDemoData && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                Sample Demo
              </span>
            )}
            {opportunity.beginnerFriendly && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Beginner-friendly
              </span>
            )}
          </div>

          {showBookmark && onToggleBookmark && (
            <button
              type="button"
              aria-label={
                opportunity.isBookmarked ? 'Remove bookmark' : 'Bookmark opportunity'
              }
              onClick={() => onToggleBookmark(opportunity)}
              className={`rounded-lg p-1.5 transition ${
                opportunity.isBookmarked
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Bookmark
                className="h-4 w-4"
                fill={opportunity.isBookmarked ? 'currentColor' : 'none'}
              />
            </button>
          )}
        </div>

        <Link
          to={`/opportunities/${opportunity._id}`}
          className="mt-3 block text-lg font-semibold leading-snug text-slate-900 hover:text-indigo-600"
        >
          {opportunity.title}
        </Link>

        <p className="mt-1 text-xs font-medium text-slate-500">
          By {opportunity.organizerName}
        </p>

        <p className="mt-2.5 line-clamp-2 text-sm text-slate-600">
          {opportunity.shortDescription}
        </p>

        {summary && (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" />
                Match Score: {summary.score}/100
              </span>
              <StatusBadge status={summary.eligibility} />
            </div>
            {summary.reasons?.length > 0 && (
              <p className="mt-1.5 text-xs text-slate-600">
                {summary.reasons[0]}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className={countdown === 'Expired' ? 'font-medium text-rose-600' : ''}>
              {countdown}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 capitalize">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {opportunity.eventMode}
            {opportunity.location?.state && opportunity.eventMode !== 'online'
              ? ` · ${opportunity.location.state}`
              : ''}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            {opportunity.teamSize?.max > 1
              ? `${opportunity.teamSize.min}-${opportunity.teamSize.max} members`
              : 'Individual'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">
            {formatFee(opportunity.feeAmount, opportunity.feeCurrency)}
          </span>
          <div className="flex items-center gap-2">
            {opportunity.verificationStatus === 'verified' && (
              <span
                title="Listing reviewed against source details"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
            <Link
              to={`/opportunities/${opportunity._id}`}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

