export interface WebSession {
  attribution: {
    gclid: string | null;
    fbclid: string | null;
    msclkid: string | null;
    gbraid: string | null;
    wbraid: string | null;
    landing_page: string;
    original_referrer: string;
    referrer: string;
    ga_client_id: string;
    referral: string;
    reschedule_job_id: string;
  };
  utm: {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
    utm_adgroup: string | null;
  };
  page: {
    current_domain: string;
    current_url: string;
    pathname: string;
    search: string;
    hash: string;
    params: Record<string, unknown>;
  };
  browser: {
    user_agent: string;
    platform: string;
    language: string;
    languages: string[];
    cookies_enabled: boolean;
    online_status: boolean;
    do_not_track: boolean | null;
  };
  display: {
    screen_width: number;
    screen_height: number;
    screen_color_depth: number;
    viewport_width: number;
    viewport_height: number;
    device_pixel_ratio: number;
  };
  temporal: {
    timezone: string;
    timezone_offset: number;
    timestamp: string;
    page_load_time: number;
  };
  capabilities: {
    session_storage_available: boolean;
    local_storage_available: boolean;
    connection_type: string;
    connection_downlink: number;
  };
}

export interface ChatRecord {
  Id: number;
  CreatedAt: string;
  UpdatedAt: string;
  userId: string;
  transcript: string | null;
  s2fId: string;
  jobType: string | null;
  zipCode: number | null;
  timeStamp: string | null;
  rawAvailability: Record<string, unknown> | null;
  readableAvailability: Record<string, unknown> | null;
  jobId: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  email: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  appointmentTime: string | null;
  webSession: WebSession;
  termsOfService: boolean | null;
  customerId: string | null;
  locationId: string | null;
  transcriptId: string;
  DBId: number;
  source: string | null;
  timeZoneMarket: string | null;
  duration: number | null;
  credits: number | null;
  teamNotes: string | null;
  existingCustomer: boolean;
  bookable: string | null; // e.g. "Bookable", "Not Bookable - Incomplete Conversation", etc.
  notBookedReasons: string | null;
}

export interface ApiResponse {
  list: ChatRecord[];
}

export interface DashboardSummary {
  totalChats: number;
  avgDuration: string;
  bookabilityRate: string;
  bookedRate: string;
  commonReasons: Array<{ reason: string; count: number }>;
}
