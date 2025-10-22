import { ApiResponse, ChatRecord } from '../types';

export class DataService {
  private baseUrl: string;
  private apiToken: string;
  private useMockData: boolean;

  constructor(config?: { baseUrl?: string; apiToken?: string; useMockData?: boolean }) {
    // NocoDB API configuration - can be overridden by constructor or use environment variables
    this.baseUrl = config?.baseUrl || import.meta.env.VITE_NOCODB_BASE_URL || '';
    this.apiToken = config?.apiToken || import.meta.env.VITE_NOCODB_API_TOKEN || '';
    this.useMockData = config?.useMockData !== undefined
      ? config.useMockData
      : (import.meta.env.VITE_USE_MOCK_DATA === 'true');

    // Log configuration in development
    if (import.meta.env.DEV) {
      console.log('[DataService] Configuration:', {
        useMockData: this.useMockData,
        hasBaseUrl: !!this.baseUrl,
        hasApiToken: !!this.apiToken,
      });
    }
  }

  /**
   * Fetch chat records from NocoDB API filtered by s2fId and optional date range
   */
  async fetchChatRecords(
    s2fId: string,
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<ChatRecord[]> {
    if (this.useMockData) {
      console.log('[DataService] Using mock data');
      return this.fetchMockData(s2fId, dateRange);
    }

    try {
      console.log('[DataService] Fetching from NocoDB API');
      const url = new URL(this.baseUrl);

      // Build where clause with s2fId filter
      const whereConditions: string[] = [`(s2fId,eq,${s2fId})`];

      // Add date range filters if provided
      if (dateRange?.startDate) {
        // NocoDB datetime sub-operator format: exactDate,YYYY-MM-DD
        whereConditions.push(`(timeStamp,ge,exactDate,${dateRange.startDate})`);
      }
      if (dateRange?.endDate) {
        // For end date, add one day to include the entire end date
        const endDate = new Date(dateRange.endDate);
        endDate.setDate(endDate.getDate() + 1);
        const endDateStr = endDate.toISOString().split('T')[0];
        whereConditions.push(`(timeStamp,lt,exactDate,${endDateStr})`);
      }

      // Combine all where conditions with AND operator
      if (whereConditions.length > 0) {
        url.searchParams.append('where', whereConditions.join('~and'));
      }

      url.searchParams.append('limit', '10000'); // Set high limit to get all records
      url.searchParams.append('offset', '0');

      console.log('[DataService] API URL:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'xc-token': this.apiToken,
          'Content-Type': 'application/json',
        },
      });

      console.log('[DataService] API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DataService] API Error response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      console.log('[DataService] API returned records:', data.list?.length || 0);
      return data.list || [];
    } catch (error) {
      console.error('[DataService] Error fetching chat records:', error);
      throw error;
    }
  }

  /**
   * Fetch mock data for development
   */
  private async fetchMockData(
    s2fId: string,
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<ChatRecord[]> {
    try {
      // In development, load from mock file
      const response = await fetch('/mock/data/response.json');
      const data: ApiResponse = await response.json();

      // Filter by s2fId
      let filtered = data.list.filter(record => record.s2fId === s2fId);

      // Apply date range filters if provided
      if (dateRange?.startDate || dateRange?.endDate) {
        filtered = filtered.filter(record => {
          if (!record.timeStamp) return false;
          const recordDate = new Date(record.timeStamp);

          if (dateRange.startDate) {
            const startDate = new Date(dateRange.startDate);
            startDate.setHours(0, 0, 0, 0);
            if (recordDate < startDate) return false;
          }

          if (dateRange.endDate) {
            const endDate = new Date(dateRange.endDate);
            endDate.setHours(23, 59, 59, 999);
            if (recordDate > endDate) return false;
          }

          return true;
        });
      }

      return filtered;
    } catch (error) {
      console.error('Error loading mock data:', error);
      return [];
    }
  }

  /**
   * Calculate advanced analytics from chat records
   */
  calculateAdvancedAnalytics(records: ChatRecord[]) {
    const totalChats = records.length;

    // === CORE METRICS ===
    // Fix: bookable is a string, not boolean
    const bookableChats = records.filter(r => r.bookable === 'Bookable').length;
    // Fix: use jobId to determine if booked
    const bookedChats = records.filter(r => r.jobId !== null && r.jobId !== undefined && r.jobId !== '').length;

    // Conversion Rate = Booked / Bookable (not total chats)
    const conversionRate = bookableChats > 0 ? (bookedChats / bookableChats) * 100 : 0;
    const bookableRate = totalChats > 0 ? (bookableChats / totalChats) * 100 : 0;
    const bookingRate = bookableChats > 0 ? (bookedChats / bookableChats) * 100 : 0;

    // Revenue opportunities (bookable but not booked)
    const revenueOpportunities = bookableChats - bookedChats;

    // Average duration
    const durationsWithValue = records.filter(r => r.duration !== null && r.duration !== undefined);
    const avgDurationSeconds = durationsWithValue.length > 0
      ? durationsWithValue.reduce((sum, r) => sum + (r.duration || 0), 0) / durationsWithValue.length
      : 0;

    // === ATTRIBUTION & TRAFFIC SOURCES ===
    const utmSourceMap = new Map<string, { total: number; bookable: number; booked: number; isPaid: boolean }>();
    const utmCampaignMap = new Map<string, { total: number; bookable: number; booked: number }>();
    const referrerMap = new Map<string, { total: number; bookable: number; booked: number }>();
    const clickIdMap = new Map<string, { total: number; bookable: number; booked: number }>();

    let directTraffic = 0;
    let paidTraffic = 0;

    records.forEach(record => {
      const isBooked = record.jobId !== null && record.jobId !== undefined && record.jobId !== '';
      const isBookable = record.bookable === 'Bookable';
      const session = record.webSession;

      if (session) {
        // UTM Source - override with referrer based on patterns
        let utmSource = session.utm?.utm_source;
        const utmCampaign = session.utm?.utm_campaign;

        // Check referrer and override utm_source if needed
        const referrer = session.attribution?.referrer;
        if (referrer) {
          const lowerReferrer = referrer.toLowerCase();

          // Check for Yahoo
          if (lowerReferrer.includes('yahoo.com') || lowerReferrer.includes('search.yahoo')) {
            utmSource = 'yahoo';
          }
          // Check for Precision Door domains (pd or precision in domain)
          else if (lowerReferrer.includes('precisiondoor') ||
                   lowerReferrer.includes('precision-door') ||
                   (lowerReferrer.includes('pd') && (lowerReferrer.includes('.com') || lowerReferrer.includes('.net')))) {
            utmSource = 'precision-door';
          }
        }

        if (utmSource) {
          const hasCampaign = !!utmCampaign;
          const lowerSource = utmSource.toLowerCase();

          // For Google-related sources, split into separate organic and paid entries
          let sourceKey = utmSource;
          const isGoogleSource = lowerSource === 'google' ||
                                 lowerSource === 'gmb' ||
                                 lowerSource === 'google my business' ||
                                 lowerSource.includes('gmblisting');

          if (isGoogleSource) {
            sourceKey = hasCampaign ? 'google-paid' : 'google-organic';
          }

          const stats = utmSourceMap.get(sourceKey) || { total: 0, bookable: 0, booked: 0, isPaid: hasCampaign };
          stats.total++;
          if (isBookable) stats.bookable++;
          if (isBooked) stats.booked++;
          // Set isPaid based on campaign presence
          stats.isPaid = hasCampaign;
          utmSourceMap.set(sourceKey, stats);

          // Check if paid: has utm_campaign means it's a paid campaign
          if (hasCampaign) {
            paidTraffic++;
          } else {
            directTraffic++;
          }
        } else {
          directTraffic++;
        }

        // UTM Campaign (already declared above)
        if (utmCampaign) {
          const stats = utmCampaignMap.get(utmCampaign) || { total: 0, bookable: 0, booked: 0 };
          stats.total++;
          if (isBookable) stats.bookable++;
          if (isBooked) stats.booked++;
          utmCampaignMap.set(utmCampaign, stats);
        }

        // Referrer (already declared above for Yahoo check, reuse it)
        if (referrer && referrer !== 'direct') {
          try {
            const domain = new URL(referrer).hostname.replace('www.', '');
            const stats = referrerMap.get(domain) || { total: 0, bookable: 0, booked: 0 };
            stats.total++;
            if (isBookable) stats.bookable++;
            if (isBooked) stats.booked++;
            referrerMap.set(domain, stats);
          } catch {
            // Invalid URL, skip
          }
        }

        // Click IDs
        const attribution = session.attribution;
        if (attribution) {
          if (attribution.gclid) {
            const stats = clickIdMap.get('Google Ads') || { total: 0, bookable: 0, booked: 0 };
            stats.total++;
            if (isBookable) stats.bookable++;
            if (isBooked) stats.booked++;
            clickIdMap.set('Google Ads', stats);
          }
          if (attribution.fbclid) {
            const stats = clickIdMap.get('Facebook Ads') || { total: 0, bookable: 0, booked: 0 };
            stats.total++;
            if (isBookable) stats.bookable++;
            if (isBooked) stats.booked++;
            clickIdMap.set('Facebook Ads', stats);
          }
          if (attribution.msclkid) {
            const stats = clickIdMap.get('Microsoft Ads') || { total: 0, bookable: 0, booked: 0 };
            stats.total++;
            if (isBookable) stats.bookable++;
            if (isBooked) stats.booked++;
            clickIdMap.set('Microsoft Ads', stats);
          }
        }
      }
    });

    // Top traffic sources
    const topTrafficSources = Array.from(utmSourceMap.entries())
      .map(([source, stats]) => ({
        source,
        count: stats.total,
        bookable: stats.bookable,
        booked: stats.booked,
        isPaid: stats.isPaid,
        conversionRate: stats.bookable > 0 ? (stats.booked / stats.bookable) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Increased from 5 to 10

    // Top campaigns
    const topCampaigns = Array.from(utmCampaignMap.entries())
      .map(([campaign, stats]) => ({
        campaign,
        count: stats.total,
        bookable: stats.bookable,
        booked: stats.booked,
        conversionRate: stats.bookable > 0 ? (stats.booked / stats.bookable) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top referrers
    const topReferrers = Array.from(referrerMap.entries())
      .map(([domain, stats]) => ({
        domain,
        count: stats.total,
        bookable: stats.bookable,
        booked: stats.booked,
        conversionRate: stats.bookable > 0 ? (stats.booked / stats.bookable) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // === JOB PERFORMANCE ===
    const jobTypeMap = new Map<string, { total: number; bookable: number; booked: number }>();
    records.forEach(record => {
      const jobType = record.jobType || 'Not Specified';
      const isBooked = record.jobId !== null && record.jobId !== undefined && record.jobId !== '';
      const isBookable = record.bookable === 'Bookable';
      const stats = jobTypeMap.get(jobType) || { total: 0, bookable: 0, booked: 0 };
      stats.total++;
      if (isBookable) stats.bookable++;
      if (isBooked) stats.booked++;
      jobTypeMap.set(jobType, stats);
    });

    const jobTypeBreakdown = Array.from(jobTypeMap.entries())
      .map(([jobType, stats]) => ({
        jobType,
        count: stats.total,
        bookable: stats.bookable,
        booked: stats.booked,
        conversionRate: stats.bookable > 0 ? (stats.booked / stats.bookable) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // === CUSTOMER INSIGHTS ===
    const existingCustomers = records.filter(r => r.existingCustomer === true).length;
    const newCustomers = totalChats - existingCustomers;

    // === QUALITY METRICS ===
    const incompleteConversations = records.filter(r =>
      r.bookable && r.bookable.includes('Incomplete Conversation')
    ).length;

    const notBookedReasons = new Map<string, number>();
    records.forEach(record => {
      if (record.notBookedReasons) {
        const count = notBookedReasons.get(record.notBookedReasons) || 0;
        notBookedReasons.set(record.notBookedReasons, count + 1);
      }
    });

    const topNotBookedReasons = Array.from(notBookedReasons.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // === CHANNEL BREAKDOWN ===
    const channelMap = new Map<string, { total: number; bookable: number; booked: number }>();
    records.forEach(record => {
      const channel = record.source || 'Unknown';
      const isBooked = record.jobId !== null && record.jobId !== undefined && record.jobId !== '';
      const isBookable = record.bookable === 'Bookable';
      const stats = channelMap.get(channel) || { total: 0, bookable: 0, booked: 0 };
      stats.total++;
      if (isBookable) stats.bookable++;
      if (isBooked) stats.booked++;
      channelMap.set(channel, stats);
    });

    const channelBreakdown = Array.from(channelMap.entries())
      .map(([channel, stats]) => ({
        channel,
        count: stats.total,
        bookable: stats.bookable,
        booked: stats.booked,
        conversionRate: stats.bookable > 0 ? (stats.booked / stats.bookable) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      // KPIs
      totalChats,
      conversionRate,
      avgDurationSeconds,
      revenueOpportunities,

      // Conversion Funnel
      bookableChats,
      bookedChats,
      bookableRate,
      bookingRate,

      // Attribution
      topTrafficSources,
      topCampaigns,
      topReferrers,
      directTraffic,
      paidTraffic,
      clickIdBreakdown: Array.from(clickIdMap.entries()).map(([platform, stats]) => ({
        platform,
        count: stats.total,
        bookable: stats.bookable,
        booked: stats.booked,
        conversionRate: stats.bookable > 0 ? (stats.booked / stats.bookable) * 100 : 0
      })),

      // Job Performance
      jobTypeBreakdown,

      // Customer Insights
      existingCustomers,
      newCustomers,

      // Quality Metrics
      incompleteConversations,
      topNotBookedReasons,

      // Channel Breakdown
      channelBreakdown,
    };
  }
}
