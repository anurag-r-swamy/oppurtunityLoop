import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  CheckCircle2,
  ListChecks,
  Award,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Users
} from 'lucide-react';
import { api } from '../../lib/api';
import { OPPORTUNITY_CATEGORIES } from '../../lib/constants';
import { OpportunityCard } from '../../components/opportunities/OpportunityCard';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { EmptyState } from '../../components/common/EmptyState';

export function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/opportunities?limit=3&sort=deadline')
      .then((res) => {
        if (active) setFeatured(res.data?.data?.opportunities || []);
      })
      .catch(() => {
        if (active) setFeatured([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/opportunities?q=${encodeURIComponent(q)}` : '/opportunities');
  };

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50/80 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Discover. Participate. Grow.
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Find Verified Student Opportunities Across Every Discipline in India
            </h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              OpportunityLoop helps college students in Engineering, MCA, Science, Commerce,
              Arts, Law, Design, Medicine, and Education check eligibility transparently, plan
              preparation, find teammates, and build an achievement portfolio.
            </p>

            <form
              onSubmit={handleSearch}
              className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
            >
              <label htmlFor="hero-search" className="sr-only">
                Search competitions and opportunities
              </label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  id="hero-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hackathons, law quizzes, research symposia, case challenges..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm shadow-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                Explore
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Category Shortcuts */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Browse by Category</h2>
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {OPPORTUNITY_CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              to={`/opportunities?category=${cat.value}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-xs transition hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Opportunities */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upcoming Opportunities</h2>
            <p className="mt-1 text-sm text-slate-600">
              Live listings from the database sorted by upcoming deadlines.
            </p>
          </div>
          <Link
            to="/opportunities"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Browse directory
          </Link>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : featured.length > 0 ? (
            featured.map((opp) => (
              <OpportunityCard key={opp._id} opportunity={opp} showBookmark={false} />
            ))
          ) : (
            <div className="md:col-span-3">
              <EmptyState
                title="No active opportunities published yet"
                description="Seed demo opportunities or register as an organizer to submit listings for verification."
                action={
                  <Link
                    to="/register"
                    className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    Get Started
                  </Link>
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* Explainable Participation Engine */}
      <section className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">
              How the Explainable Participation Engine Works
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Instead of guessing whether a competition fits you, OpportunityLoop evaluates
              published eligibility rules against your profile and explains every factor.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <ShieldCheck className="h-7 w-7 text-indigo-600" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                1. Transparent Eligibility Check
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Classifies listings as Eligible, Ineligible, or Unknown when criteria or profile
                details are missing—never guessing eligibility silently.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <Sparkles className="h-7 w-7 text-indigo-600" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                2. Clear Match Breakdown
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Weighted scoring across interests, skills, academic relevance, beginner
                suitability, mode, location, and deadline feasibility.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <ListChecks className="h-7 w-7 text-indigo-600" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                3. Actionable Participation Journey
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Move from discovery to preparation checklists, external registration, team
                formation, and a documented participation portfolio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beginners & Journey Preview */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs">
            <BookOpen className="h-7 w-7 text-emerald-600" />
            <h2 className="mt-3 text-xl font-bold text-slate-900">
              Built to Help Beginners Start Confidently
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Filter specifically for beginner-friendly competitions, workshops, and quizzes.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                See exactly which skills or profile fields to add before applying.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Use structured preparation checklists so you never miss submission steps.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-7">
            <Award className="h-7 w-7 text-indigo-600" />
            <h2 className="mt-3 text-xl font-bold text-slate-900">
              Participation Tracking Preview
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Track every milestone clearly—while keeping self-reported entries transparently
              distinguished from organizer-confirmed records.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                'Discover',
                'Check Eligibility',
                'Save',
                'Prepare Checklist',
                'Register Externally',
                'Submit',
                'Portfolio Outcome'
              ].map((step, i) => (
                <span
                  key={step}
                  className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-800"
                >
                  {i + 1}. {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dual CTAs */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-indigo-600 p-8 text-white shadow-sm">
            <h2 className="text-2xl font-bold">For College Students</h2>
            <p className="mt-2 text-sm text-indigo-100">
              Create your academic profile in minutes and get explainable recommendations
              tailored to your degree, skills, and goals.
            </p>
            <Link
              to="/register"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Register as Student <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-8 text-white shadow-sm">
            <Users className="h-6 w-6 text-indigo-400" />
            <h2 className="mt-2 text-2xl font-bold">For Campus Clubs & Organizers</h2>
            <p className="mt-2 text-sm text-slate-300">
              Submit hackathons, symposia, debates, quizzes, and workshops with verified source
              links and clear eligibility rules.
            </p>
            <Link
              to="/register?role=organizer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Register as Organizer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

