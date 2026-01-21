
import React from 'react';
import { Job } from './types';

export const JOB_BOARDS = [
  { name: 'LinkedIn', url: 'https://linkedin.com/jobs' },
  { name: 'Indeed', url: 'https://indeed.com' },
  { name: 'Glassdoor', url: 'https://glassdoor.com' },
  { name: 'RemoteOK', url: 'https://remoteok.com' }
];

export const MOCK_RECORDS: Job[] = [
  {
    id: 'job_ai_1',
    title: 'Senior AI Research Engineer',
    company: 'Anthropic',
    location: 'San Francisco, CA',
    country: 'USA',
    workMode: 'Onsite',
    salary: '$220k - $310k',
    description: 'Developing next-generation LLM alignment techniques. Requires deep expertise in PyTorch and Transformer architectures.',
    url: 'https://anthropic.com/careers',
    source: 'LinkedIn',
    postedAt: new Date(Date.now() - 3600000).toISOString(),
    isNew: true,
    category: 'AI',
    skills: ['PyTorch', 'Transformers', 'LLM Alignment', 'Python', 'RLHF']
  },
  {
    id: 'job_data_1',
    title: 'Principal Data Scientist',
    company: 'Databricks',
    location: 'Seattle, WA',
    country: 'USA',
    workMode: 'Hybrid',
    salary: '$200k - $280k',
    description: 'Leading data initiatives for predictive scaling. Expert knowledge of Spark and large-scale ML deployment is essential.',
    url: 'https://databricks.com/jobs',
    source: 'RemoteOK',
    postedAt: new Date(Date.now() - 7200000).toISOString(),
    isNew: true,
    category: 'Data Science',
    skills: ['Apache Spark', 'MLOps', 'Predictive Modeling', 'Scala', 'Python']
  },
  {
    id: 'job_analytics_1',
    title: 'Head of Product Analytics',
    company: 'Figma',
    location: 'London',
    country: 'United Kingdom',
    workMode: 'Onsite',
    salary: '£140k - £180k',
    description: 'Building the data culture at Figma. You will lead a team of analysts to drive product insights using SQL and Python.',
    url: 'https://figma.com/careers',
    source: 'Glassdoor',
    postedAt: new Date(Date.now() - 14400000).toISOString(),
    isNew: true,
    category: 'Analytics',
    skills: ['SQL', 'Product Analytics', 'Amplitude', 'Team Leadership', 'Python']
  },
  {
    id: 'job_eng_1',
    title: 'Senior Data Engineer',
    company: 'Snowflake',
    location: 'Berlin',
    country: 'Germany',
    workMode: 'Remote',
    salary: '€90k - €130k',
    description: 'Optimize data pipelines for multi-cloud environments. Deep experience with Snowflake and dbt.',
    url: 'https://snowflake.com/careers',
    source: 'Indeed',
    postedAt: new Date(Date.now() - 86400000).toISOString(),
    isNew: true,
    category: 'Data Engineering',
    skills: ['Snowflake', 'dbt', 'SQL', 'Airflow', 'Cloud Data Warehousing']
  },
  {
    id: 'job_ai_2',
    title: 'MLOps Architect',
    company: 'NVIDIA',
    location: 'Toronto, ON',
    country: 'Canada',
    workMode: 'Hybrid',
    salary: 'CAD 180k - 250k',
    description: 'Building the foundation for autonomous driving models. Scaling GPU clusters and orchestration.',
    url: 'https://nvidia.com/jobs',
    source: 'LinkedIn',
    postedAt: new Date(Date.now() - 1800000).toISOString(),
    isNew: true,
    category: 'AI',
    skills: ['Kubernetes', 'CUDA', 'Docker', 'Distributed Systems', 'ML Infrastructure']
  }
];
