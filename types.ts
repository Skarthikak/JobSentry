
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  workMode: 'Onsite' | 'Remote' | 'Hybrid';
  salary?: string;
  description: string;
  url: string;
  source: 'LinkedIn' | 'Indeed' | 'Glassdoor' | 'RemoteOK';
  postedAt: string; // ISO String
  isNew: boolean;
  category: 'AI' | 'Analytics' | 'Data Science' | 'Data Engineering';
  skills?: string[];
}

export interface OutreachDraft {
  jobId: string;
  linkedinMessage: string;
  emailBody: string;
  emailSubject: string;
}

export interface UserProfile {
  name: string;
  resumeText: string;
  targetRole: string;
}

export interface AppState {
  jobs: Job[];
  seenJobIds: string[];
  lastSync: string | null;
  profile: UserProfile | null;
}
