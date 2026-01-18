/**
 * DataForSEO API Types
 */

export interface DataForSEOConfig {
  login: string;
  password: string;
  baseUrl: string;
}

export interface DataForSEOResponse<T> {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: DataForSEOTask<T>[];
}

export interface DataForSEOTask<T> {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  path: string[];
  data: Record<string, unknown>;
  result: T[];
}

export interface SERPTaskResult {
  keyword: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  spell?: {
    keyword: string;
    type: string;
  };
  item_types: string[];
  se_results_count: number;
  items_count: number;
  items: SERPItem[];
}

export interface SERPItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  position: string;
  xpath: string;
  domain: string;
  title: string;
  url: string;
  description: string;
  breadcrumb?: string;
  is_image?: boolean;
  is_video?: boolean;
  is_featured_snippet?: boolean;
  is_malicious?: boolean;
  links?: {
    type: string;
    title: string;
    url: string;
    description?: string;
  }[];
}

export interface KeywordDataResult {
  keyword: string;
  location_code: number;
  language_code: string;
  search_volume: number;
  competition: number;
  competition_level: string;
  cpc: number;
  monthly_searches: MonthlySearch[];
}

export interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

export interface KeywordSuggestion {
  keyword: string;
  search_volume: number;
  competition_level: string;
  cpc: number;
  keyword_difficulty: number;
}

export class DataForSEOError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'DataForSEOError';
  }
}
