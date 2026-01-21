
import React from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onSelect: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onSelect }) => {
  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    const intervals = [
      { label: 'h', seconds: 3600 },
      { label: 'm', seconds: 60 }
    ];
    for (let i = 0; i < intervals.length; i++) {
      const interval = intervals[i];
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) return `${count}${interval.label} ago`;
    }
    return 'Just now';
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'AI': return 'bg-purple-100 text-purple-700';
      case 'Data Science': return 'bg-blue-100 text-blue-700';
      case 'Analytics': return 'bg-amber-100 text-amber-700';
      case 'Data Engineering': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getWorkModeColor = (mode: Job['workMode']) => {
    switch (mode) {
      case 'Remote': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'Hybrid': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Onsite': return 'bg-slate-50 text-slate-600 border-slate-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const skillsList = job.skills?.join(', ') || '';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group relative flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">
              {job.source}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getCategoryColor(job.category)}`}>
              {job.category}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getWorkModeColor(job.workMode)}`}>
              {job.workMode}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1">
            {job.title}
          </h3>
          <p className="text-sm font-medium text-slate-600 flex items-center gap-1">
            <span className="text-slate-400">🏢</span> {job.company} • <span className="text-slate-400">📍</span> {job.location}, {job.country}
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0 ml-4">
          <span className="text-[10px] font-medium text-slate-400 uppercase">{timeAgo(job.postedAt)}</span>
          {job.salary && <span className="text-xs font-bold text-emerald-600 mt-1">{job.salary}</span>}
        </div>
      </div>
      
      <p className="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">
        {job.description}
      </p>

      {/* Key Skills Section */}
      {job.skills && job.skills.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Key Skills</div>
          <p className="text-xs text-indigo-600 font-medium truncate" title={skillsList}>
            {skillsList}
          </p>
        </div>
      )}

      <div className="mt-auto grid grid-cols-2 gap-3">
        <button
          onClick={() => onSelect(job)}
          className="bg-slate-900 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
        >
          Draft Outreach
        </button>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all hover:translate-y-[-1px] active:translate-y-[0px] text-center flex items-center justify-center shadow-lg shadow-indigo-100"
        >
          Apply Now
        </a>
      </div>
    </div>
  );
};

export default JobCard;
