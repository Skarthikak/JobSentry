
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import Layout from './components/Layout';
import JobCard from './components/JobCard';
import ResumeManager from './components/ResumeManager';
import { storageService } from './services/storageService';
import { generateOutreach, chatWithAssistant, getCompanyInsights, getLocationInsights } from './services/geminiService';
import { Job, OutreachDraft } from './types';
import { MOCK_RECORDS } from './constants';

const DiscoveryFeed: React.FC<{ onSelectJob: (job: Job) => void }> = ({ onSelectJob }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'salary'>('date');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Modal States
  const [insightData, setInsightData] = useState<{ text: string, sources?: any[], type: 'company' | 'location' } | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  
  const navigate = useNavigate();

  const loadJobs = useCallback(() => {
    const state = storageService.getState();
    setJobs(state.jobs);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 1500));
      
      const newMockJobs: Job[] = [];
      const cats = ['AI', 'Analytics', 'Data Science', 'Data Engineering'] as const;
      const modes = ['Remote', 'Onsite', 'Hybrid'] as const;
      const countries = ['USA', 'United Kingdom', 'Germany', 'Canada', 'Australia'];
      const citiesByCountry: Record<string, string[]> = {
        'USA': ['San Francisco', 'Seattle', 'Austin', 'New York'],
        'United Kingdom': ['London', 'Manchester', 'Edinburgh'],
        'Germany': ['Berlin', 'Munich', 'Hamburg'],
        'Canada': ['Toronto', 'Vancouver', 'Montreal'],
        'Australia': ['Sydney', 'Melbourne']
      };
      
      for(let i = 0; i < 30; i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        const postedAt = new Date(Date.now() - (daysAgo * 86400000) - Math.floor(Math.random() * 3600000)).toISOString();
        const baseJob = MOCK_RECORDS[Math.floor(Math.random() * MOCK_RECORDS.length)];
        const country = countries[Math.floor(Math.random() * countries.length)];
        const city = citiesByCountry[country][Math.floor(Math.random() * citiesByCountry[country].length)];
        
        newMockJobs.push({
          ...baseJob,
          id: `sync_${Date.now()}_${i}`,
          postedAt,
          isNew: true,
          category: cats[Math.floor(Math.random() * cats.length)],
          country,
          location: city,
          workMode: modes[Math.floor(Math.random() * modes.length)]
        });
      }

      storageService.syncJobs(newMockJobs);
      loadJobs();
    } catch (err) {
      setError("Sync failed. Please check your connectivity.");
    } finally {
      setIsSyncing(false);
    }
  };

  const countries = useMemo(() => {
    const unique = new Set(jobs.map(j => j.country));
    return ['All', ...Array.from(unique)].sort();
  }, [jobs]);

  const cities = useMemo(() => {
    let relevantJobs = jobs;
    if (countryFilter !== 'All') {
      relevantJobs = jobs.filter(j => j.country === countryFilter);
    }
    const unique = new Set(relevantJobs.map(j => {
      if (j.location.toLowerCase().includes('remote')) return 'Remote';
      return j.location.split(',')[0].trim();
    }));
    return ['All', ...Array.from(unique)].sort();
  }, [jobs, countryFilter]);

  const categories = ['All', 'AI', 'Analytics', 'Data Science', 'Data Engineering'];

  // Helper to parse salary strings like "$220k - $310k" or "£140k" into a comparable number
  const parseSalaryValue = (salaryStr?: string): number => {
    if (!salaryStr) return 0;
    // Extract first numeric group
    const match = salaryStr.match(/(\d+)/);
    if (!match) return 0;
    let val = parseInt(match[1], 10);
    // Multiply by 1000 if 'k' is present
    if (salaryStr.toLowerCase().includes('k')) {
      val *= 1000;
    }
    return val;
  };

  const filteredJobs = useMemo(() => {
    let result = [...jobs];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.company.toLowerCase().includes(q) || 
        j.description.toLowerCase().includes(q)
      );
    }

    if (countryFilter !== 'All') {
      result = result.filter(j => j.country === countryFilter);
    }

    if (cityFilter !== 'All') {
      result = result.filter(j => 
        j.location.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    if (categoryFilter !== 'All') {
      result = result.filter(j => j.category === categoryFilter);
    }

    return result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      } else if (sortBy === 'salary') {
        return parseSalaryValue(b.salary) - parseSalaryValue(a.salary);
      } else {
        return a.company.localeCompare(b.company);
      }
    });
  }, [jobs, sortBy, countryFilter, cityFilter, categoryFilter, searchQuery]);

  // Data Aggregation for Market Trends
  const trendData = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    return dates.map((dateStr, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const isoDate = d.toISOString().split('T')[0];
      
      return {
        name: dateStr,
        'AI': jobs.filter(j => j.category === 'AI' && j.postedAt.startsWith(isoDate)).length,
        'Data Science': jobs.filter(j => j.category === 'Data Science' && j.postedAt.startsWith(isoDate)).length,
        'Analytics': jobs.filter(j => j.category === 'Analytics' && j.postedAt.startsWith(isoDate)).length,
        'Data Engineering': jobs.filter(j => j.category === 'Data Engineering' && j.postedAt.startsWith(isoDate)).length,
      };
    });
  }, [jobs]);

  // Data Aggregation for Work Mode Distribution (Based on Filtered Jobs)
  const workModeData = useMemo(() => {
    const counts = { Remote: 0, Hybrid: 0, Onsite: 0 };
    filteredJobs.forEach(j => {
      if (counts[j.workMode] !== undefined) {
        counts[j.workMode]++;
      }
    });
    return [
      { name: 'Remote', value: counts.Remote, color: '#0ea5e9' },
      { name: 'Hybrid', value: counts.Hybrid, color: '#6366f1' },
      { name: 'Onsite', value: counts.Onsite, color: '#64748b' },
    ].filter(item => item.value > 0);
  }, [filteredJobs]);

  const handleCompanyInsight = async (company: string) => {
    setIsInsightLoading(true);
    setInsightData(null);
    try {
      const res = await getCompanyInsights(company);
      setInsightData({ ...res, type: 'company' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsInsightLoading(false);
    }
  };

  const handleLocationInsight = async (location: string) => {
    setIsInsightLoading(true);
    setInsightData(null);
    try {
      let coords;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) { /* ignore */ }
      
      const res = await getLocationInsights(location, coords);
      setInsightData({ ...res, type: 'location' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsInsightLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 rounded-2xl p-8 text-white shadow-2xl">
        <div>
          <h3 className="text-2xl font-extrabold mb-1">Autonomous Job Hunter</h3>
          <p className="text-indigo-200 text-sm max-w-md opacity-90">
            Scanning 4+ job boards daily for elite AI and Data roles. Narrow down by city or tech niche.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-all disabled:opacity-50 flex items-center gap-2 group"
        >
          {isSyncing ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Refreshing Feed...
            </>
          ) : (
            <>
              <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
              Sync Daily Posts
            </>
          )}
        </button>
      </div>

      {/* Market Intelligence Trends */}
      <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Market Intelligence</h4>
            <p className="text-xs text-slate-400">Weekly velocity of AI & Data job postings</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400"></span> AI</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Data Sci</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Analytics</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Eng</div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* Bar Chart: History Velocity */}
          <div className="h-48 w-full lg:w-2/3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="AI" stackId="a" fill="#818cf8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Data Science" stackId="a" fill="#60a5fa" />
                <Bar dataKey="Analytics" stackId="a" fill="#fbbf24" />
                <Bar dataKey="Data Engineering" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart: Work Mode Distribution */}
          <div className="h-48 w-full lg:w-1/3 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Work Mode Mix</div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workModeData}
                    innerRadius={35}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {workModeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3 mt-1">
              {workModeData.map(item => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Section */}
      <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-6">
          {/* Search Bar */}
          <div className="flex-1 min-w-[280px]">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Search Roles</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: 'Senior', 'Engineer', 'Anthropic'..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>

          {/* Country Filter */}
          <div className="w-full md:w-auto">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Country</label>
            <div className="flex items-center gap-2">
              <span className="text-lg">🌍</span>
              <select 
                value={countryFilter}
                onChange={(e) => {
                    setCountryFilter(e.target.value);
                    setCityFilter('All');
                }}
                className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer min-w-[160px]"
              >
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* City Filter */}
          <div className="w-full md:w-auto">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">City</label>
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <select 
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer min-w-[160px]"
              >
                {cities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
          </div>

          {/* Sort Control */}
          <div className="w-full md:w-auto ml-auto">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Display Order</label>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button 
                onClick={() => setSortBy('date')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'date' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                Latest
              </button>
              <button 
                onClick={() => setSortBy('company')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'company' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                Company
              </button>
              <button 
                onClick={() => setSortBy('salary')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'salary' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                Salary
              </button>
            </div>
          </div>
        </div>

        {/* Category Narrowing */}
        <div className="pt-4 border-t border-slate-50">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Role Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  categoryFilter === cat 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex items-center gap-3 animate-bounce">
          <span className="text-lg">⚠️</span> {error}
        </div>
      )}

      {/* Main Feed */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
          <div className="text-5xl mb-4 grayscale opacity-40">🔎</div>
          <p className="text-slate-500 font-bold text-lg">No roles found matching these filters.</p>
          <p className="text-slate-400 text-sm mt-2">Try expanding your location search or reset categories.</p>
          <button 
            onClick={() => { setCountryFilter('All'); setCityFilter('All'); setCategoryFilter('All'); setSearchQuery(''); }}
            className="mt-6 text-indigo-600 font-bold text-sm hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredJobs.map(job => (
            <div key={job.id} className="relative">
              <JobCard job={job} onSelect={(j) => {
                onSelectJob(j);
                navigate('/workspace');
              }} />
              
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button 
                  onClick={() => handleCompanyInsight(job.company)}
                  className="bg-white/80 backdrop-blur shadow-sm border border-slate-100 p-2 rounded-lg hover:bg-indigo-50 transition-colors text-xs flex items-center gap-1 group"
                  title="Search Insights (Flash 3)"
                >
                  <span className="opacity-70 group-hover:opacity-100">🏢</span>
                </button>
                <button 
                  onClick={() => handleLocationInsight(`${job.location}, ${job.country}`)}
                  className="bg-white/80 backdrop-blur shadow-sm border border-slate-100 p-2 rounded-lg hover:bg-indigo-50 transition-colors text-xs flex items-center gap-1 group"
                  title="Location Insights (Flash 2.5)"
                >
                  <span className="opacity-70 group-hover:opacity-100">📍</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(insightData || isInsightLoading) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-6 text-white ${insightData?.type === 'company' ? 'bg-indigo-600' : 'bg-violet-600'} flex justify-between items-center`}>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {isInsightLoading ? 'Generating Intelligence...' : (insightData?.type === 'company' ? 'Company Intelligence' : 'Location Context')}
                </h3>
                <p className="text-white/70 text-xs">Powered by Gemini & Grounding</p>
              </div>
              <button onClick={() => setInsightData(null)} className="text-2xl leading-none hover:rotate-90 transition-transform">✕</button>
            </div>
            
            <div className="p-8">
              {isInsightLoading ? (
                <div className="flex flex-col items-center py-8">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-500 font-medium">Querying live web data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-slate-700 leading-relaxed text-lg font-medium">
                    {insightData?.text}
                  </p>
                  
                  {insightData?.sources && insightData.sources.length > 0 && (
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Verification Sources</h4>
                      <div className="flex flex-col gap-2">
                        {insightData.sources.map((s: any, idx) => (
                          <a 
                            key={idx} 
                            href={s.web?.uri || s.maps?.uri} 
                            target="_blank" 
                            className="flex items-center gap-2 text-xs text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors overflow-hidden"
                          >
                            <span className="shrink-0">{insightData.type === 'company' ? '🌐' : '🗺️'}</span>
                            <span className="truncate font-semibold">{s.web?.title || s.maps?.title || 'External Source'}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setInsightData(null)}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm"
                  >
                    Got it
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string, sources?: any[] }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ 
        role: m.role, 
        parts: [{ text: m.text }] 
      }));
      const result = await chatWithAssistant(userMsg, history);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: result.text || "Sorry, I couldn't process that.",
        sources: result.sources
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to Gemini. Please check your API key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen && (
        <div className="bg-white w-80 md:w-96 h-[500px] border border-slate-200 rounded-3xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-6 duration-500">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-5 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold">Career AI Coach</h3>
              <p className="text-[10px] text-white/70">Thinking Mode Active (Gemini 3 Pro)</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-12 px-4">
                <div className="text-4xl mb-4">✨</div>
                <p className="font-bold text-slate-600 mb-1">How can I help you today?</p>
                <p className="leading-relaxed">Ask about job trends, interview prep, or your search strategy.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] p-4 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200/50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Sources Found</p>
                      {m.sources.map((s: any, idx) => (
                        <a key={idx} href={s.web?.uri} target="_blank" className="block text-indigo-500 hover:underline truncate mb-1">
                          {s.web?.title || s.web?.uri}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase ml-2 tracking-widest">Thinking</span>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex gap-2 bg-slate-50/50">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for search advice..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              ➔
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-2xl shadow-2xl flex items-center justify-center text-3xl hover:shadow-indigo-200 hover:scale-110 active:scale-95 transition-all"
      >
        {isOpen ? '✕' : '✨'}
      </button>
    </div>
  );
};

const Workspace: React.FC<{ selectedJob: Job | null; onClear: () => void }> = ({ selectedJob, onClear }) => {
  const navigate = useNavigate();
  const [outreach, setOutreach] = useState<OutreachDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedLinkedIn, setEditedLinkedIn] = useState("");
  const [editedEmailBody, setEditedEmailBody] = useState("");
  const [editedEmailSubject, setEditedEmailSubject] = useState("");

  useEffect(() => {
    return () => onClear();
  }, [onClear]);

  const handleGenerate = async () => {
    if (!selectedJob) return;
    const profile = storageService.getState().profile;
    if (!profile || !profile.resumeText) {
      setError("Please complete your profile first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateOutreach(selectedJob, profile);
      setOutreach(result);
      setEditedLinkedIn(result.linkedinMessage);
      setEditedEmailBody(result.emailBody);
      setEditedEmailSubject(result.emailSubject);
    } catch (err: any) {
      setError(err.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  if (!selectedJob) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
        <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center text-6xl animate-pulse">🤖</div>
        <h3 className="text-2xl font-black text-slate-800">Workspace is Idle</h3>
        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
          The AI needs a target. Select an <b>AI or Data role</b> from the Discovery Feed to start personalizing your outreach.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
        >
          Go to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div>
          <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em]">Strategic Outreach</span>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">
            {selectedJob.title} 
            <span className="text-slate-400 font-normal mx-3">@</span> 
            {selectedJob.company}
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
              📍 {selectedJob.location}, {selectedJob.country}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1 text-xs font-bold text-indigo-600">
              ✨ {selectedJob.category}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1 text-xs font-bold text-sky-600">
              💻 {selectedJob.workMode}
            </span>
          </div>
        </div>
        <button onClick={onClear} className="bg-slate-100 text-slate-400 w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-all">
          ✕
        </button>
      </div>

      {!outreach && !isGenerating && (
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-3xl p-12 text-center shadow-inner">
          <div className="text-4xl mb-6">🖋️</div>
          <p className="text-indigo-900 font-bold text-xl mb-6 max-w-md mx-auto">
            Ready to craft a high-conversion pitch for this {selectedJob.category} role?
          </p>
          <button
            onClick={handleGenerate}
            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
          >
            Generate Personalized Draft
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center gap-6 shadow-sm">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-600/10 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <div className="text-center">
            <p className="text-slate-800 font-black text-lg mb-1 animate-pulse">Deep Analyzing Role Requirements</p>
            <p className="text-slate-400 text-sm italic">Matching resume accomplishments with company mission...</p>
          </div>
        </div>
      )}

      {outreach && (
        <div className="grid grid-cols-1 gap-10 pb-16">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg shadow-slate-100/50 transition-all hover:shadow-xl">
            <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h4 className="font-black text-slate-800 flex items-center gap-3 tracking-tight">
                <span className="text-indigo-600">💬</span> LinkedIn Direct Message
              </h4>
              <button onClick={() => copyToClipboard(editedLinkedIn)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors">
                Copy text
              </button>
            </div>
            <div className="p-8">
              <div className="relative group">
                <textarea
                  className="w-full text-slate-700 text-lg whitespace-pre-wrap leading-relaxed italic border-l-4 border-indigo-200 pl-6 bg-slate-50/50 p-6 rounded-r-2xl outline-none focus:ring-4 focus:ring-indigo-100 min-h-[180px] resize-none transition-all"
                  value={editedLinkedIn}
                  onChange={(e) => setEditedLinkedIn(e.target.value)}
                />
                <div className="absolute bottom-4 right-4">
                  <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm ${editedLinkedIn.length > 500 ? 'bg-red-50 text-red-500' : 'bg-white text-slate-400'}`}>
                    {editedLinkedIn.length} Characters
                  </span>
                </div>
              </div>
              <p className="mt-4 text-[10px] font-bold text-slate-400 italic">Pro-Tip: Keep it short to ensure it fits in a connection request if needed.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg shadow-slate-100/50 transition-all hover:shadow-xl">
            <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h4 className="font-black text-slate-800 flex items-center gap-3 tracking-tight">
                <span className="text-violet-600">✉️</span> Professional Email
              </h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => copyToClipboard(`Subject: ${editedEmailSubject}\n\n${editedEmailBody}`)} 
                  className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                >
                  Copy Full
                </button>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Email Subject</label>
                <input 
                  type="text"
                  value={editedEmailSubject}
                  onChange={(e) => setEditedEmailSubject(e.target.value)}
                  className="w-full font-black text-slate-900 bg-slate-50/50 border-2 border-transparent focus:border-violet-100 rounded-xl p-4 outline-none transition-all text-lg"
                />
              </div>
              <div className="h-px bg-slate-100 mx-[-2rem]" />
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Email Content</label>
                <textarea
                  value={editedEmailBody}
                  onChange={(e) => setEditedEmailBody(e.target.value)}
                  className="w-full text-slate-700 text-lg whitespace-pre-wrap leading-[1.8] bg-slate-50/50 border-2 border-transparent focus:border-violet-100 rounded-xl p-6 outline-none min-h-[400px] resize-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleClearJob = useCallback(() => {
    setSelectedJob(null);
  }, []);
  
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={
            <DiscoveryFeed onSelectJob={(job) => setSelectedJob(job)} />
          } />
          <Route path="/workspace" element={
            <Workspace 
              selectedJob={selectedJob} 
              onClear={handleClearJob} 
            />
          } />
          <Route path="/profile" element={<ResumeManager />} />
        </Routes>
        <ChatAssistant />
      </Layout>
    </Router>
  );
};

export default App;
