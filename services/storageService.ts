
import { Job, AppState, UserProfile } from "../types";

const STORAGE_KEY = 'jobsentry_state';

const DEFAULT_STATE: AppState = {
  jobs: [],
  seenJobIds: [],
  lastSync: null,
  profile: null
};

export const storageService = {
  getState: (): AppState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_STATE;
    } catch (error) {
      console.error("Failed to parse JobSentry state from storage:", error);
      return DEFAULT_STATE;
    }
  },

  saveState: (state: AppState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save JobSentry state to storage:", error);
    }
  },

  updateProfile: (profile: UserProfile) => {
    const state = storageService.getState();
    state.profile = profile;
    storageService.saveState(state);
  },

  syncJobs: (scrapedJobs: Job[]): Job[] => {
    try {
      const state = storageService.getState();
      const now = Date.now();
      // Expanded from 24h to 7 days to support Market Intelligence trends
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      console.log(`Starting sync with ${scrapedJobs.length} potential leads...`);

      // 1. Input Validation & Internal Deduplication
      const uniqueBatchIds = new Set<string>();
      const validScrapedJobs = scrapedJobs.filter(job => {
        if (!job || !job.id) {
          console.warn("Discarding malformed job entry:", job);
          return false;
        }
        if (uniqueBatchIds.has(job.id)) {
          return false;
        }
        uniqueBatchIds.add(job.id);
        return true;
      });

      // 2. Delta Filtering & Persistence Check
      const newJobs = validScrapedJobs.filter(job => {
        const postedTime = new Date(job.postedAt).getTime();
        const isRecent = postedTime > sevenDaysAgo;
        const isNew = !state.seenJobIds.includes(job.id);
        
        return isRecent && isNew;
      });

      if (newJobs.length > 0) {
        // Merge new jobs with existing history
        const mergedJobs = [...newJobs, ...state.jobs];
        
        // 3. Robust Sorting: Always ensure newest jobs are at the top
        // and cap history at 200 for a balance between data retention and performance.
        state.jobs = mergedJobs
          .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
          .slice(0, 400); // Increased slice to handle week worth of data
        
        // Update tracking set for future de-duplication
        const updatedSeenIds = new Set([...state.seenJobIds, ...newJobs.map(j => j.id)]);
        state.seenJobIds = Array.from(updatedSeenIds);
        
        state.lastSync = new Date().toISOString();
        storageService.saveState(state);
        
        console.log(`Sync complete. Found ${newJobs.length} new jobs. Total history size: ${state.jobs.length}.`);
      }

      return newJobs;
    } catch (error) {
      console.error("Critical error during job synchronization:", error);
      return [];
    }
  }
};