import { createGrid, GridApi, GridOptions, ColDef } from 'ag-grid-community';
import { marked } from 'marked';
import { ChatRecord } from '../types';
import { DataService } from '../services/dataService';

export class AnalyticsDashboard extends HTMLElement {
  private root: ShadowRoot | HTMLElement;
  private dataService: DataService;
  private s2fId: string = '';
  private gridApi: GridApi | null = null;
  private chartData: ChatRecord[] = [];
  private dateRange: { startDate?: string; endDate?: string } = {};
  private selectedAttributionSource: string = '';

  static get observedAttributes() {
    return ['s2fid'];
  }

  constructor() {
    super();
    // Use the element itself instead of Shadow DOM to allow parent styles
    this.root = this;
    this.dataService = new DataService(); // Will use environment variables
  }

  connectedCallback() {
    this.s2fId = this.getAttribute('s2fid') || '';
    this.render();
    this.loadData();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 's2fid' && oldValue !== newValue) {
      this.s2fId = newValue;
      this.loadData();
    }
  }

  private async loadData() {
    if (!this.s2fId) {
      this.renderError('No s2fId provided');
      return;
    }

    this.renderLoading();

    try {
      const records = await this.dataService.fetchChatRecords(this.s2fId, this.dateRange);
      this.chartData = records;
      this.render();
      this.populateAttributionSourceDropdown();
      this.initializeGrid();
      this.renderSummary();
    } catch (error) {
      console.error('Error loading data:', error);
      this.renderError('Failed to load data. Please try again later.');
    }
  }

  private populateAttributionSourceDropdown() {
    const sourceSelect = this.root.querySelector('#attribution-source-filter') as HTMLSelectElement;
    if (!sourceSelect) return;

    // Get unique attribution sources from the data (utm_source)
    const sources = new Set<string>();
    this.chartData.forEach(record => {
      const utmSource = record.webSession?.utm?.utm_source;
      if (utmSource && utmSource.trim()) {
        sources.add(utmSource);
      }
    });

    // Sort sources alphabetically
    const sortedSources = Array.from(sources).sort();

    // Clear existing options except "All Sources"
    sourceSelect.innerHTML = '<option value="">All Sources</option>';

    // Add source options with normalized names
    sortedSources.forEach(source => {
      const option = document.createElement('option');
      option.value = source;
      const normalized = this.normalizeTrafficSource(source);
      option.textContent = normalized.name;
      sourceSelect.appendChild(option);
    });
  }

  private render() {
    this.root.innerHTML = `
      ${this.getStyles()}
      <div class="dashboard-container">
        <div class="dashboard-header">
          <div class="dashboard-title">
            <div class="dashboard-icon">
              <i class="ri-bar-chart-box-line"></i>
            </div>
            <span>AI Chatbot Analytics</span>
            <span class="markid-badge">
              <i class="ri-map-pin-fill"></i> ${this.s2fId}
            </span>
          </div>
          <div class="header-filters">
            <div class="date-filter">
              <label for="start-date">
                <i class="ri-calendar-line"></i>
                Start Date
              </label>
              <input type="date" id="start-date" class="date-input" />
            </div>
            <div class="date-filter">
              <label for="end-date">
                <i class="ri-calendar-line"></i>
                End Date
              </label>
              <input type="date" id="end-date" class="date-input" />
            </div>
            <button class="filter-apply-btn" id="apply-date-filter">
              <i class="ri-filter-line"></i>
              Apply Filters
            </button>
            <button class="filter-clear-btn" id="clear-date-filter">
              <i class="ri-close-line"></i>
              Clear All
            </button>
          </div>
        </div>

        <div class="summary-section">
          <h2 class="summary-title">Chat Summary</h2>
          <div class="summary-grid" id="summary-grid">
            <!-- Summary cards will be injected here -->
          </div>

          <div class="breakdown-grid" id="breakdown-grid">
            <!-- Breakdown cards will be injected here -->
          </div>
        </div>

        <div class="table-section">
          <div class="table-header">
            <h2 class="table-title">Chat Log</h2>
            <div class="table-controls">
              <div class="filter-buttons" id="filter-buttons">
                <button class="filter-btn active" data-filter="all">
                  <i class="ri-list-check"></i> All Chats
                </button>
                <button class="filter-btn" data-filter="booked">
                  <i class="ri-calendar-check-fill"></i> Booked
                </button>
                <button class="filter-btn" data-filter="revenue-opportunities">
                  <i class="ri-money-dollar-circle-line"></i> Revenue Opportunities
                </button>
                <button class="filter-btn" data-filter="incomplete">
                  <i class="ri-chat-delete-line"></i> Incomplete
                </button>
              </div>
              <div class="traffic-source-filter">
                <label for="attribution-source-filter">
                  <i class="ri-line-chart-line"></i>
                  Attribution Source
                </label>
                <select id="attribution-source-filter" class="source-select">
                  <option value="">All Sources</option>
                </select>
              </div>
              <button class="icon-button" id="column-toggle-btn">
                <i class="ri-layout-column-line"></i>
              </button>
            </div>
          </div>

          <div class="column-visibility-panel" id="column-visibility-panel" style="display: none;">
            <div class="panel-header">
              <h3>Show/Hide Columns</h3>
              <button class="close-btn" id="close-panel-btn">
                <i class="ri-close-line"></i>
              </button>
            </div>
            <div class="column-checkboxes" id="column-checkboxes"></div>
          </div>

          <div class="table-container">
            <div id="grid-container" class="ag-theme-alpine-dark" style="height: 800px; width: 100%;"></div>
          </div>
        </div>

        <!-- Transcript Drawer -->
        <div id="transcript-overlay" class="transcript-overlay" style="display: none;"></div>
        <div id="transcript-drawer" class="transcript-drawer">
          <div class="drawer-header">
            <h2 class="drawer-title">
              <i class="ri-file-text-line"></i> Chat Transcript
            </h2>
            <button class="close-btn" id="close-drawer-btn">
              <i class="ri-close-line"></i>
            </button>
          </div>

          <div class="drawer-metadata">
            <div class="metadata-item">
              <span class="metadata-label">Transcript ID:</span>
              <span class="metadata-value" id="drawer-transcript-id">—</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Duration:</span>
              <span class="metadata-value" id="drawer-transcript-duration">—</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Date:</span>
              <span class="metadata-value" id="drawer-transcript-date">—</span>
            </div>
          </div>

          <div class="drawer-content">
            <div id="transcript-content" class="transcript-text">Loading transcript...</div>
          </div>
        </div>

        <!-- Profile Drawer -->
        <div id="profile-overlay" class="profile-overlay" style="display: none;"></div>
        <div id="profile-drawer" class="profile-drawer">
          <div class="drawer-header">
            <h2 class="drawer-title">
              <i class="ri-user-line"></i> Customer Profile
            </h2>
            <button class="close-btn" id="close-profile-btn">
              <i class="ri-close-line"></i>
            </button>
          </div>

          <div id="profile-content" class="profile-content">
            <!-- Profile content will be injected here -->
            Loading profile...
          </div>
        </div>
      </div>
    `;

    // Add filter button functionality
    const filterButtons = this.root.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const filter = target.getAttribute('data-filter');

        // Update active state
        filterButtons.forEach(b => b.classList.remove('active'));
        target.classList.add('active');

        // Apply filter
        this.applyFilter(filter || 'all');
      });
    });

    // Add column visibility toggle
    const columnToggleBtn = this.root.querySelector('#column-toggle-btn') as HTMLElement;
    const columnPanel = this.root.querySelector('#column-visibility-panel') as HTMLElement;
    const closePanelBtn = this.root.querySelector('#close-panel-btn') as HTMLElement;

    if (columnToggleBtn && columnPanel) {
      columnToggleBtn.addEventListener('click', () => {
        const isVisible = columnPanel.style.display !== 'none';
        columnPanel.style.display = isVisible ? 'none' : 'block';
      });
    }

    if (closePanelBtn && columnPanel) {
      closePanelBtn.addEventListener('click', () => {
        columnPanel.style.display = 'none';
      });
    }

    // Add transcript drawer close functionality
    const closeDrawerBtn = this.root.querySelector('#close-drawer-btn');
    const transcriptOverlay = this.root.querySelector('#transcript-overlay');

    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', () => {
        this.closeTranscriptDrawer();
      });
    }

    if (transcriptOverlay) {
      transcriptOverlay.addEventListener('click', () => {
        this.closeTranscriptDrawer();
      });
    }

    // Add profile drawer close functionality
    const closeProfileBtn = this.root.querySelector('#close-profile-btn');
    const profileOverlay = this.root.querySelector('#profile-overlay');

    if (closeProfileBtn) {
      closeProfileBtn.addEventListener('click', () => {
        this.closeProfileDrawer();
      });
    }

    if (profileOverlay) {
      profileOverlay.addEventListener('click', () => {
        this.closeProfileDrawer();
      });
    }

    // Add header date filter functionality
    const applyDateFilterBtn = this.root.querySelector('#apply-date-filter');
    const clearDateFilterBtn = this.root.querySelector('#clear-date-filter');
    const startDateInput = this.root.querySelector('#start-date') as HTMLInputElement;
    const endDateInput = this.root.querySelector('#end-date') as HTMLInputElement;

    if (applyDateFilterBtn && startDateInput && endDateInput) {
      applyDateFilterBtn.addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        // Update date range
        this.dateRange = {
          startDate: startDate || undefined,
          endDate: endDate || undefined
        };

        // Reload data with new filters
        this.loadData();
      });
    }

    if (clearDateFilterBtn && startDateInput && endDateInput) {
      clearDateFilterBtn.addEventListener('click', () => {
        // Clear date filter inputs
        startDateInput.value = '';
        endDateInput.value = '';

        // Clear date range
        this.dateRange = {};

        // Reload data without filters
        this.loadData();
      });
    }

    // Add table attribution source filter functionality
    const attributionSourceFilter = this.root.querySelector('#attribution-source-filter') as HTMLSelectElement;
    if (attributionSourceFilter) {
      attributionSourceFilter.addEventListener('change', () => {
        this.selectedAttributionSource = attributionSourceFilter.value;

        if (!this.gridApi) return;

        if (this.selectedAttributionSource) {
          // Apply external filter for attribution source
          this.gridApi.setGridOption('isExternalFilterPresent', () => true);
          this.gridApi.setGridOption('doesExternalFilterPass', (node: any) => {
            const utmSource = node.data?.webSession?.utm?.utm_source;
            return utmSource === this.selectedAttributionSource;
          });
        } else {
          // Clear external filter
          this.gridApi.setGridOption('isExternalFilterPresent', () => false);
          this.gridApi.setGridOption('doesExternalFilterPass', () => true);
        }

        this.gridApi.onFilterChanged();
      });
    }
  }

  private applyFilter(filter: string) {
    if (!this.gridApi) return;

    switch (filter) {
      case 'booked':
        // Show only records that have been booked (jobId exists)
        this.gridApi.setFilterModel({
          jobId: {
            filterType: 'text',
            type: 'notBlank'
          }
        });
        break;
      case 'revenue-opportunities':
        // Bookable but not booked (bookable='Bookable' AND jobId is blank)
        this.gridApi.setFilterModel({
          bookable: {
            filterType: 'text',
            type: 'equals',
            filter: 'Bookable'
          },
          jobId: {
            filterType: 'text',
            type: 'blank'
          }
        });
        break;
      case 'incomplete':
        // Incomplete conversations (bookable contains 'Incomplete')
        this.gridApi.setFilterModel({
          bookable: {
            filterType: 'text',
            type: 'contains',
            filter: 'Incomplete'
          }
        });
        break;
      case 'all':
      default:
        this.gridApi.setFilterModel(null);
        break;
    }

    // Apply the filter changes
    this.gridApi.onFilterChanged();
  }

  private renderLoading() {
    this.root.innerHTML = `
      ${this.getStyles()}
      <div class="dashboard-container">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading analytics data...</div>
        </div>
      </div>
    `;
  }

  private renderError(message: string) {
    this.root.innerHTML = `
      ${this.getStyles()}
      <div class="dashboard-container">
        <div class="error-container">
          <div class="error-title">Error</div>
          <div class="error-message">${message}</div>
        </div>
      </div>
    `;
  }

  private renderSummary() {
    const analytics = this.dataService.calculateAdvancedAnalytics(this.chartData);

    // KPI Cards
    const summaryGrid = this.root.querySelector('#summary-grid');
    if (summaryGrid) {
      const avgMinutes = Math.floor(analytics.avgDurationSeconds / 60);
      const avgSeconds = Math.floor(analytics.avgDurationSeconds % 60);

      summaryGrid.innerHTML = `
        <div class="kpi-card">
          <div class="kpi-icon">
            <i class="ri-message-3-fill"></i>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Total Conversations</div>
            <div class="kpi-value">${analytics.totalChats.toLocaleString()}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-icon-success">
            <i class="ri-arrow-right-up-line"></i>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Conversion Rate</div>
            <div class="kpi-value">${analytics.bookingRate.toFixed(1)}%</div>
            <div class="kpi-subtitle">${analytics.bookedChats} of ${analytics.bookableChats} bookable</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-icon-info">
            <i class="ri-time-fill"></i>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Avg Chat Duration</div>
            <div class="kpi-value">${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}</div>
            <div class="kpi-subtitle">Minutes:Seconds</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-icon-warning">
            <i class="ri-coin-fill"></i>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Revenue Opportunities</div>
            <div class="kpi-value">${analytics.revenueOpportunities}</div>
            <div class="kpi-subtitle">Bookable but not booked</div>
          </div>
        </div>
      `;
    }

    // Analytics Sections
    const breakdownGrid = this.root.querySelector('#breakdown-grid');
    if (breakdownGrid) {
      breakdownGrid.innerHTML = `
        <!-- Attribution & Traffic Sources -->
        <div class="analytics-section">
          <h3 class="analytics-section-title"><i class="ri-line-chart-fill"></i> Top Traffic Sources</h3>
          <div class="referrer-grid">
            ${analytics.topTrafficSources.length > 0 ? analytics.topTrafficSources.map((source, index) => {
              const normalized = this.normalizeTrafficSource(source.source);
              const logoUrl = normalized.domain ? `https://img.logo.dev/${normalized.domain}?token=pk_JuRpzKiHQniWr0CmqpMOBA` : '';
              // Use isPaid from data (based on utm_campaign presence) instead of normalization
              const paidBadge = source.isPaid ? '<span class="source-badge source-paid">PAID</span>' : '<span class="source-badge source-organic">ORGANIC</span>';
              return `
              <div class="referrer-card">
                <div class="referrer-header">
                  ${logoUrl ? `<img src="${logoUrl}" class="referrer-logo" alt="${normalized.name}" onerror="this.style.display='none'">` : ''}
                  <div class="referrer-info">
                    <div class="referrer-domain">${normalized.name}</div>
                    <div class="referrer-rank">#${index + 1} ${paidBadge}</div>
                  </div>
                </div>
                <div class="referrer-stats">
                  <div class="referrer-stat">
                    <span class="referrer-stat-value">${source.count}</span>
                    <span class="referrer-stat-label">chats</span>
                  </div>
                  <div class="referrer-stat">
                    <span class="referrer-stat-value">${source.bookable}</span>
                    <span class="referrer-stat-label">bookable</span>
                  </div>
                  <div class="referrer-stat">
                    <span class="referrer-stat-value">${source.booked}</span>
                    <span class="referrer-stat-label">booked</span>
                  </div>
                  <div class="referrer-stat">
                    <span class="referrer-stat-value referrer-conversion">${source.conversionRate.toFixed(1)}%</span>
                    <span class="referrer-stat-label">conv.</span>
                  </div>
                </div>
              </div>
              `;
            }).join(''): '<div class="no-data">No traffic source data available</div>'}
          </div>
        </div>

        <!-- Direct vs Paid Traffic -->
        <div class="analytics-section">
          <h3 class="analytics-section-title"><i class="ri-pie-chart-fill"></i> Traffic Split</h3>
          <div class="traffic-split">
            <div class="traffic-split-item">
              <div class="traffic-split-icon traffic-split-icon-direct"><i class="ri-global-line"></i></div>
              <div class="traffic-split-content">
                <div class="traffic-split-label">Direct Traffic</div>
                <div class="traffic-split-value">${analytics.directTraffic}</div>
                <div class="traffic-split-percent">${analytics.totalChats > 0 ? ((analytics.directTraffic / analytics.totalChats) * 100).toFixed(1) : 0}%</div>
              </div>
            </div>
            <div class="traffic-split-divider"></div>
            <div class="traffic-split-item">
              <div class="traffic-split-icon traffic-split-icon-paid"><i class="ri-advertisement-fill"></i></div>
              <div class="traffic-split-content">
                <div class="traffic-split-label">Paid Traffic</div>
                <div class="traffic-split-value">${analytics.paidTraffic}</div>
                <div class="traffic-split-percent">${analytics.totalChats > 0 ? ((analytics.paidTraffic / analytics.totalChats) * 100).toFixed(1) : 0}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Referrers -->
        <div class="analytics-section">
          <h3 class="analytics-section-title"><i class="ri-link-m"></i> Top Referrers</h3>
          <div class="referrer-grid">
            ${analytics.topReferrers && analytics.topReferrers.length > 0 ? analytics.topReferrers.map((ref, index) => {
              const logoUrl = `https://img.logo.dev/${ref.domain}?token=pk_JuRpzKiHQniWr0CmqpMOBA`;
              return `
              <div class="referrer-card">
                <div class="referrer-header">
                  <img src="${logoUrl}" class="referrer-logo" alt="${ref.domain}" onerror="this.style.display='none'">
                  <div class="referrer-info">
                    <div class="referrer-domain">${ref.domain}</div>
                    <div class="referrer-rank">#${index + 1}</div>
                  </div>
                </div>
                <div class="referrer-stats">
                  <div class="referrer-stat">
                    <span class="referrer-stat-value">${ref.count}</span>
                    <span class="referrer-stat-label">chats</span>
                  </div>
                  <div class="referrer-stat">
                    <span class="referrer-stat-value">${ref.bookable}</span>
                    <span class="referrer-stat-label">bookable</span>
                  </div>
                  <div class="referrer-stat">
                    <span class="referrer-stat-value">${ref.booked}</span>
                    <span class="referrer-stat-label">booked</span>
                  </div>
                  <div class="referrer-stat">
                    <span class="referrer-stat-value referrer-conversion">${ref.conversionRate.toFixed(1)}%</span>
                    <span class="referrer-stat-label">conv.</span>
                  </div>
                </div>
              </div>
              `;
            }).join('') : '<div class="no-data">No referrer data available</div>'}
          </div>
        </div>

        <!-- Channel Breakdown -->
        <div class="analytics-section">
          <h3 class="analytics-section-title"><i class="ri-message-3-fill"></i> Channel Performance</h3>
          <div class="stats-grid">
            ${analytics.channelBreakdown && analytics.channelBreakdown.length > 0 ? analytics.channelBreakdown.map(channelData => {
              const channelName = channelData.channel === 'Webchat' ? 'Web' : channelData.channel;
              const channelIcon = channelData.channel === 'SMS' ? 'ri-message-3-fill' :
                                  channelData.channel === 'Voice' ? 'ri-phone-fill' :
                                  channelData.channel === 'Webchat' ? 'ri-chat-3-fill' : 'ri-question-fill';
              return `
              <div class="stat-card channel-card">
                <div class="stat-card-header">
                  <div class="channel-icon"><i class="${channelIcon}"></i></div>
                  <span class="stat-name">${channelName}</span>
                </div>
                <div class="stat-metrics">
                  <div class="stat-metric">
                    <span class="stat-metric-label">Chats</span>
                    <span class="stat-metric-value">${channelData.count}</span>
                  </div>
                  <div class="stat-metric">
                    <span class="stat-metric-label">Bookable</span>
                    <span class="stat-metric-value">${channelData.bookable}</span>
                  </div>
                  <div class="stat-metric">
                    <span class="stat-metric-label">Booked</span>
                    <span class="stat-metric-value">${channelData.booked}</span>
                  </div>
                  <div class="stat-metric">
                    <span class="stat-metric-label">Conv.</span>
                    <span class="stat-metric-value stat-metric-success">${channelData.conversionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              `;
            }).join('') : '<div class="no-data">No channel data available</div>'}
          </div>
        </div>

        <!-- Job Performance -->
        <div class="analytics-section">
          <h3 class="analytics-section-title"><i class="ri-tools-fill"></i> Job Type Performance</h3>
          <div class="job-type-grid">
            ${analytics.jobTypeBreakdown.slice(0, 6).map(job => `
              <div class="job-type-card">
                <div class="job-type-name">${this.normalizeJobType(job.jobType)}</div>
                <div class="job-type-stats">
                  <div class="job-type-stat">
                    <span>${job.count}</span>
                    <span class="job-type-stat-label">chats</span>
                  </div>
                  <div class="job-type-stat">
                    <span>${job.bookable}</span>
                    <span class="job-type-stat-label">bookable</span>
                  </div>
                  <div class="job-type-stat">
                    <span>${job.booked}</span>
                    <span class="job-type-stat-label">booked</span>
                  </div>
                  <div class="job-type-stat">
                    <span class="job-type-conversion">${job.conversionRate.toFixed(0)}%</span>
                    <span class="job-type-stat-label">conv.</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Customer Insights -->
        <div class="analytics-section">
          <h3 class="analytics-section-title"><i class="ri-user-fill"></i> Customer Insights</h3>
          <div class="customer-insights">
            <div class="customer-insight-card">
              <div class="customer-insight-icon customer-insight-icon-new"><i class="ri-user-add-fill"></i></div>
              <div class="customer-insight-content">
                <div class="customer-insight-value">${analytics.newCustomers}</div>
                <div class="customer-insight-label">New Customers</div>
                <div class="customer-insight-percent">${analytics.totalChats > 0 ? ((analytics.newCustomers / analytics.totalChats) * 100).toFixed(1) : 0}%</div>
              </div>
            </div>
            <div class="customer-insight-card">
              <div class="customer-insight-icon customer-insight-icon-existing"><i class="ri-user-star-fill"></i></div>
              <div class="customer-insight-content">
                <div class="customer-insight-value">${analytics.existingCustomers}</div>
                <div class="customer-insight-label">Existing Customers</div>
                <div class="customer-insight-percent">${analytics.totalChats > 0 ? ((analytics.existingCustomers / analytics.totalChats) * 100).toFixed(1) : 0}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quality Metrics -->
        <div class="analytics-section">
          <h3 class="analytics-section-title"><i class="ri-alert-fill"></i> Quality & Optimization</h3>
          <div class="quality-metrics">
            <div class="quality-metric-card">
              <div class="quality-metric-header">
                <i class="ri-close-circle-fill"></i>
                <span>Incomplete Conversations</span>
              </div>
              <div class="quality-metric-value">${analytics.incompleteConversations}</div>
              <div class="quality-metric-percent">${analytics.totalChats > 0 ? ((analytics.incompleteConversations / analytics.totalChats) * 100).toFixed(1) : 0}% of total</div>
            </div>
            <div class="quality-metric-card">
              <div class="quality-metric-header">
                <i class="ri-error-warning-fill"></i>
                <span>Top Not Booked Reasons</span>
              </div>
              <div class="not-booked-reasons">
                ${analytics.topNotBookedReasons.map(reason => `
                  <div class="not-booked-reason">
                    <span class="not-booked-reason-text">${reason.reason}</span>
                    <span class="not-booked-reason-count">${reason.count}</span>
                  </div>
                `).join('')}
                ${analytics.topNotBookedReasons.length === 0 ? '<div class="no-data-small">No data available</div>' : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  private initializeGrid() {
    const gridContainer = this.root.querySelector('#grid-container') as HTMLElement;
    if (!gridContainer) return;

    const columnDefs: ColDef[] = [
      {
        headerName: 'S2F ID',
        field: 's2fId',
        width: 120,
        filter: 'agTextColumnFilter',
        hide: false,
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          return `<span class="badge">${params.value}</span>`;
        },
      },
      {
        headerName: 'Timestamp',
        field: 'timeStamp',
        width: 180,
        filter: 'agDateColumnFilter',
        hide: false,
        valueFormatter: (params) => {
          if (!params.value) return '—';
          return new Date(params.value).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        },
      },
      {
        headerName: 'ID',
        field: 'Id',
        width: 80,
        cellClass: 'font-semibold',
        headerClass: 'ag-center-header',
        cellStyle: { textAlign: 'center' },
        hide: true,
      },
      {
        headerName: 'Created',
        field: 'CreatedAt',
        width: 180,
        filter: 'agDateColumnFilter',
        sort: 'desc', // Default sort: newest first
        hide: true,
        valueFormatter: (params) => {
          if (!params.value) return '—';
          return new Date(params.value).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        },
      },
      {
        headerName: 'Name',
        width: 180,
        hide: false,
        valueGetter: (params) => {
          const first = params.data?.firstName || '';
          const last = params.data?.lastName || '';
          return first || last ? `${first} ${last}`.trim() : null;
        },
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          return `<span style="font-weight: 500;">${params.value}</span>`;
        },
      },
      {
        headerName: 'Phone',
        field: 'phoneNumber',
        width: 140,
        hide: false,
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          const formatted = this.formatPhoneNumber(params.value);
          return `<a href="tel:${params.value}" style="color: var(--color-primary); text-decoration: none;">${formatted}</a>`;
        },
      },
      {
        headerName: 'Email',
        field: 'email',
        width: 200,
        hide: false,
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          return `<a href="mailto:${params.value}" style="color: var(--color-primary); text-decoration: none;">${params.value}</a>`;
        },
      },
      {
        headerName: 'City',
        field: 'city',
        width: 130,
        filter: 'agSetColumnFilter',
        hide: true,
      },
      {
        headerName: 'State',
        field: 'state',
        width: 90,
        filter: 'agSetColumnFilter',
        hide: true,
      },
      {
        headerName: 'Zip',
        field: 'zipCode',
        width: 100,
        type: 'numericColumn',
        hide: true,
      },
      {
        headerName: 'Job Type',
        field: 'jobType',
        width: 120,
        filter: 'agSetColumnFilter',
        hide: false,
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          return `<span class="badge">${params.value}</span>`;
        },
      },
      {
        headerName: 'Job ID',
        field: 'jobId',
        width: 100,
        hide: true,
      },
      {
        headerName: 'Bookable',
        field: 'bookable',
        width: 150,
        filter: 'agSetColumnFilter',
        hide: false,
        cellRenderer: (params: any) => {
          const value = params.value;
          if (!value) return '<span style="color: var(--color-text-muted);">—</span>';

          // Short, readable format based on bookable status
          if (value === 'Bookable') {
            return '<span class="badge badge-success"><i class="ri-checkbox-circle-fill"></i> Bookable</span>';
          } else if (value.startsWith('Not Bookable - ')) {
            const reason = value.replace('Not Bookable - ', '');
            // Shorten common reasons
            let shortReason = reason;
            switch(reason) {
              case 'Incomplete Conversation': shortReason = 'Incomplete'; break;
              case 'Service Not Offered': shortReason = 'No Service'; break;
              case 'Service Not Provided': shortReason = 'No Service'; break;
              case 'Outside Service Area': shortReason = 'Out of Area'; break;
              case 'Parts Inquiry': shortReason = 'Parts Only'; break;
              case 'Marketing Inquiry': shortReason = 'Marketing'; break;
              case 'Leave A Review': shortReason = 'Review'; break;
              case 'Leave A Message for Manager': shortReason = 'Manager Msg'; break;
              case 'Spam/Irrelevant': shortReason = 'Spam'; break;
            }
            return `<span class="badge badge-error"><i class="ri-close-circle-fill"></i> ${shortReason}</span>`;
          }
          return `<span class="badge">${value}</span>`;
        },
      },
      {
        headerName: 'Booked',
        field: 'jobId',
        width: 110,
        hide: false,
        cellRenderer: (params: any) => {
          // Show checkmark if jobId exists (meaning appointment was booked)
          if (params.value) return '<span style="color: var(--color-success); font-weight: 500;"><i class="ri-calendar-check-fill"></i> Booked</span>';
          return '<span style="color: var(--color-text-muted);">—</span>';
        },
      },
      {
        headerName: 'Not Booked Reason',
        field: 'notBookedReasons',
        width: 180,
        filter: 'agSetColumnFilter',
        hide: true,
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          return `<span class="badge badge-warning">${params.value}</span>`;
        },
      },
      {
        headerName: 'Duration',
        field: 'duration',
        width: 100,
        type: 'numericColumn',
        filter: 'agNumberColumnFilter',
        hide: true,
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          const minutes = Math.floor(params.value / 60);
          const seconds = params.value % 60;
          return `<span style="color: var(--color-text-primary); font-weight: 500;">${minutes}:${seconds.toString().padStart(2, '0')}</span>`;
        },
      },
      {
        headerName: 'Source',
        field: 'source',
        width: 130,
        filter: 'agSetColumnFilter',
        hide: true,
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          return `<span class="badge">${params.value}</span>`;
        },
      },
      {
        headerName: 'Existing Customer',
        field: 'existingCustomer',
        width: 140,
        filter: 'agSetColumnFilter',
        hide: true,
        cellRenderer: (params: any) => {
          if (params.value === true) return '<span style="color: var(--color-accent);"><i class="ri-user-star-fill"></i> Yes</span>';
          return '<span style="color: var(--color-text-muted);">No</span>';
        },
      },
      {
        headerName: 'Web Session',
        width: 140,
        hide: false,
        valueGetter: (params) => {
          const session = params.data?.webSession;
          if (!session) return null;
          // Return landing page or current URL as a summary
          return session.attribution?.landing_page || session.page?.current_url || 'Active';
        },
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          const session = params.data?.webSession;
          if (!session) return '<span style="color: var(--color-text-muted);">—</span>';

          // Show a badge indicating session exists
          const utmSource = session.utm?.utm_source;
          const referrer = session.attribution?.referrer;

          if (utmSource) {
            return `<span class="badge badge-utm"><i class="ri-link"></i> ${utmSource}</span>`;
          } else if (referrer && referrer !== 'direct') {
            return `<span class="badge"><i class="ri-external-link-line"></i> ${referrer.split('/')[2] || 'Referral'}</span>`;
          } else {
            return `<span class="badge"><i class="ri-global-line"></i> Direct</span>`;
          }
        },
      },
      {
        headerName: 'UTM Source',
        width: 130,
        filter: 'agSetColumnFilter',
        hide: true,
        valueGetter: (params) => params.data?.webSession?.utm?.utm_source,
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          return `<span class="badge badge-utm">${params.value}</span>`;
        },
      },
      {
        headerName: 'UTM Medium',
        width: 130,
        filter: 'agSetColumnFilter',
        hide: true,
        valueGetter: (params) => params.data?.webSession?.utm?.utm_medium,
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          return `<span class="badge badge-utm">${params.value}</span>`;
        },
      },
      {
        headerName: 'UTM Campaign',
        width: 150,
        filter: 'agSetColumnFilter',
        hide: true,
        valueGetter: (params) => params.data?.webSession?.utm?.utm_campaign,
        cellRenderer: (params: any) => {
          if (!params.value) return '<span style="color: var(--color-text-muted);">—</span>';
          return `<span class="badge badge-utm">${params.value}</span>`;
        },
      },
      {
        headerName: 'Transcript',
        width: 130,
        pinned: 'right',
        cellRenderer: (params: any) => {
          const hasTranscript = params.data?.transcript || params.data?.transcriptId;
          if (!hasTranscript) return '<span style="color: var(--color-text-muted);">—</span>';
          return '<button class="action-button transcript-btn"><i class="ri-file-text-line"></i> View</button>';
        },
        onCellClicked: (params) => {
          if (params.data?.transcript || params.data?.transcriptId) {
            this.openTranscriptDrawer(params.data);
          }
        },
        sortable: false,
        filter: false,
      },
      {
        headerName: 'Profile',
        width: 120,
        pinned: 'right',
        cellRenderer: () => {
          return '<button class="action-button profile-btn"><i class="ri-user-line"></i> View</button>';
        },
        onCellClicked: (params) => {
          this.openProfileDrawer(params.data);
        },
        sortable: false,
        filter: false,
      },
    ];

    const gridOptions: GridOptions = {
      columnDefs,
      rowData: this.chartData,
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
      },
      pagination: false, // Disable pagination to show all records
      domLayout: 'normal', // Use 'normal' layout to enable scrolling
      rowSelection: 'single',
      suppressHorizontalScroll: false, // Enable horizontal scrolling
      sideBar: {
        toolPanels: [
          {
            id: 'columns',
            labelDefault: 'Columns',
            labelKey: 'columns',
            iconKey: 'columns',
            toolPanel: 'agColumnsToolPanel',
          },
          {
            id: 'filters',
            labelDefault: 'Filters',
            labelKey: 'filters',
            iconKey: 'filter',
            toolPanel: 'agFiltersToolPanel',
          },
        ],
        defaultToolPanel: '',
      },
    };

    this.gridApi = createGrid(gridContainer, gridOptions);

    // Setup column visibility checkboxes
    this.setupColumnVisibility(columnDefs);
  }

  private setupColumnVisibility(columnDefs: ColDef[]) {
    const checkboxContainer = this.root.querySelector('#column-checkboxes');
    if (!checkboxContainer) return;

    checkboxContainer.innerHTML = '';

    columnDefs.forEach((col, index) => {
      // Don't show checkboxes for action columns (Transcript, Profile)
      if (col.headerName === 'Transcript' || col.headerName === 'Profile') return;

      const wrapper = document.createElement('div');
      wrapper.className = 'column-checkbox-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `col-${index}`;
      // Set checked state based on whether column is hidden or not
      checkbox.checked = !col.hide; // If hide is true, checkbox is unchecked; if hide is false/undefined, checkbox is checked
      checkbox.addEventListener('change', () => {
        if (this.gridApi) {
          this.gridApi.setColumnsVisible([col.field || col.headerName || ''], checkbox.checked);
        }
      });

      const label = document.createElement('label');
      label.htmlFor = `col-${index}`;
      label.textContent = col.headerName || '';

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      checkboxContainer.appendChild(wrapper);
    });
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX if 10 digits
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // Return original if not 10 digits
    return phone;
  }

  private parseConversation(markdown: string): string {
    // Split by horizontal rules (conversation separators)
    const messages = markdown.split(/---+/).filter(msg => msg.trim());

    let conversationHtml = '<div class="conversation">';

    messages.forEach(message => {
      const trimmed = message.trim();
      if (!trimmed) return;

      // Extract speaker name and timestamp
      // Format: **Name** *(timestamp)*
      const speakerMatch = trimmed.match(/^\*\*(.+?)\*\*\s*\*\((.+?)\)\*/);

      if (speakerMatch) {
        const speaker = speakerMatch[1];
        const timestamp = speakerMatch[2];

        // Get message content (everything after the speaker line)
        const contentStart = trimmed.indexOf('\n', trimmed.indexOf(')'));
        const content = contentStart > -1 ? trimmed.substring(contentStart).trim() : '';

        // Determine if this is agent or customer
        const isAgent = speaker.toLowerCase() === 'grace' || speaker.toLowerCase().includes('agent');

        // Parse markdown in content to HTML
        const parsedContent = marked.parse(content, { async: false }) as string;

        conversationHtml += `
          <div class="message ${isAgent ? 'message-agent' : 'message-customer'}">
            <div class="message-header">
              <span class="message-speaker ${isAgent ? 'speaker-agent' : 'speaker-customer'}">
                ${isAgent ? '<i class="ri-customer-service-2-fill"></i>' : '<i class="ri-user-fill"></i>'}
                ${speaker}
              </span>
              <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-content">
              ${parsedContent}
            </div>
          </div>
        `;
      }
    });

    conversationHtml += '</div>';
    return conversationHtml;
  }

  private openTranscriptDrawer(record: ChatRecord) {
    const drawer = this.root.querySelector('#transcript-drawer') as HTMLElement;
    const overlay = this.root.querySelector('#transcript-overlay') as HTMLElement;
    const transcriptContent = this.root.querySelector('#transcript-content');
    const transcriptId = this.root.querySelector('#drawer-transcript-id');
    const transcriptDuration = this.root.querySelector('#drawer-transcript-duration');
    const transcriptDate = this.root.querySelector('#drawer-transcript-date');

    if (!drawer || !overlay || !transcriptContent) return;

    // Set transcript content - parse markdown to styled conversation
    if (transcriptContent) {
      if (record.transcript) {
        // Parse the markdown transcript into styled conversation HTML
        const conversationHtml = this.parseConversation(record.transcript);
        transcriptContent.innerHTML = conversationHtml;
      } else {
        transcriptContent.innerHTML = '<div class="no-transcript"><em style="color: var(--color-text-muted);"><i class="ri-error-warning-line"></i> No transcript available. Transcript ID: ' + (record.transcriptId || 'N/A') + '</em></div>';
      }
    }

    // Set metadata
    if (transcriptId) transcriptId.textContent = record.transcriptId || 'N/A';
    if (transcriptDuration && record.duration) {
      const minutes = Math.floor(record.duration / 60);
      const seconds = record.duration % 60;
      transcriptDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (transcriptDuration) {
      transcriptDuration.textContent = 'N/A';
    }
    if (transcriptDate) {
      transcriptDate.textContent = record.CreatedAt
        ? new Date(record.CreatedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'N/A';
    }

    // Show drawer and overlay
    overlay.style.display = 'block';
    drawer.classList.add('open');
  }

  private closeTranscriptDrawer() {
    const drawer = this.root.querySelector('#transcript-drawer') as HTMLElement;
    const overlay = this.root.querySelector('#transcript-overlay') as HTMLElement;

    if (drawer && overlay) {
      drawer.classList.remove('open');
      overlay.style.display = 'none';
    }
  }

  private getLogoUrl(domain: string): string {
    if (!domain) return '';
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    return `https://img.logo.dev/${cleanDomain}?token=pk_JuRpzKiHQniWr0CmqpMOBA`;
  }

  private normalizeJobType(jobType: string): string {
    if (!jobType) return '';
    // Remove hyphens and convert to title case
    return jobType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private normalizeTrafficSource(source: string): { name: string; domain: string; isPaid: boolean } {
    if (!source) return { name: 'Unknown', domain: '', isPaid: false };

    const lowerSource = source.toLowerCase();

    // Handle split Google sources
    if (lowerSource === 'google-paid') {
      return { name: 'Google Ads', domain: 'google.com', isPaid: true };
    }
    if (lowerSource === 'google-organic') {
      return { name: 'Google Organic', domain: 'google.com', isPaid: false };
    }

    // Map common variations to normalized names, domains, and paid status
    if (lowerSource === 'gmb' || lowerSource === 'google my business') {
      return { name: 'Business Profile', domain: 'google.com', isPaid: false };
    }
    if (lowerSource.includes('gmblisting') || lowerSource.includes('google business listing')) {
      return { name: 'Business Listing', domain: 'google.com', isPaid: false };
    }
    if (lowerSource === 'google' || lowerSource.includes('google.com')) {
      return { name: 'Google', domain: 'google.com', isPaid: false };
    }
    if (lowerSource === 'adwords' || lowerSource === 'google ads' || lowerSource.includes('googleads')) {
      return { name: 'Google Ads', domain: 'google.com', isPaid: true };
    }
    if (lowerSource === 'bing' || lowerSource.includes('bing.com')) {
      return { name: 'Bing Ads', domain: 'bing.com', isPaid: true };
    }
    if (lowerSource === 'yahoo' || lowerSource.includes('yahoo.com')) {
      return { name: 'Yahoo Ads', domain: 'yahoo.com', isPaid: true };
    }
    if (lowerSource === 'precision-door' || lowerSource.includes('precisiondoor') || lowerSource.includes('precision-door')) {
      return { name: 'Precision Door', domain: 'precisiondoor.com', isPaid: false };
    }
    if (lowerSource === 'facebook' || lowerSource.includes('facebook.com') || lowerSource.includes('fb')) {
      return { name: 'Facebook Ads', domain: 'facebook.com', isPaid: true };
    }
    if (lowerSource === 'instagram' || lowerSource.includes('instagram.com') || lowerSource.includes('ig')) {
      return { name: 'Instagram Ads', domain: 'instagram.com', isPaid: true };
    }
    if (lowerSource.includes('youtube')) {
      return { name: 'YouTube Ads', domain: 'youtube.com', isPaid: true };
    }
    if (lowerSource === 'chatgpt' || lowerSource.includes('openai')) {
      return { name: 'ChatGPT', domain: 'openai.com', isPaid: false };
    }

    // Default: treat as organic unless explicitly known to be paid
    const normalized = source.charAt(0).toUpperCase() + source.slice(1);
    return { name: normalized, domain: source.toLowerCase(), isPaid: false };
  }

  private renderProfileDrawer(record: ChatRecord): string {
    const fullName = `${record.firstName || ''} ${record.lastName || ''}`.trim() || '—';
    const phone = record.phoneNumber ? this.formatPhoneNumber(record.phoneNumber) : '—';
    const email = record.email || '—';
    const address = record.streetAddress || '';
    const cityState = `${record.city || ''}, ${record.state || ''}`.replace(/, $/, '');
    const fullAddress = `${address}${address && cityState ? ', ' : ''}${cityState} ${record.zipCode || ''}`.trim() || '—';

    const createdDate = record.CreatedAt
      ? new Date(record.CreatedAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '—';

    const duration = record.duration
      ? `${Math.floor(record.duration / 60)}:${(record.duration % 60).toString().padStart(2, '0')}`
      : '—';

    const landingPage = record.webSession?.attribution?.landing_page;
    const referrer = record.webSession?.attribution?.referrer;
    const utmSource = record.webSession?.utm?.utm_source;
    const utmMedium = record.webSession?.utm?.utm_medium;
    const utmCampaign = record.webSession?.utm?.utm_campaign;

    return `
      <div class="profile-quick-meta">
        <div class="quick-meta-item"><strong>Record #${record.Id || 'N/A'}</strong></div>
        <div class="quick-meta-item">Created: ${createdDate}</div>
      </div>

      <div class="profile-section">
        <div class="section-header" data-section="customer">
          <i class="ri-user-fill"></i>
          <span>Customer Information</span>
          <i class="ri-arrow-down-s-line toggle-icon"></i>
        </div>
        <div class="section-content" id="section-customer">
          <div class="data-row"><span class="data-label">Name:</span><span class="data-value">${fullName}</span></div>
          <div class="data-row"><span class="data-label">Phone:</span><span class="data-value">${phone !== '—' ? `<a href="tel:${record.phoneNumber}" class="profile-link">${phone}</a>` : '—'}</span></div>
          <div class="data-row"><span class="data-label">Email:</span><span class="data-value">${email !== '—' ? `<a href="mailto:${email}" class="profile-link">${email}</a>` : '—'}</span></div>
          <div class="data-row"><span class="data-label">Address:</span><span class="data-value">${fullAddress}</span></div>
          <div class="data-row"><span class="data-label">Existing Customer:</span><span class="data-value">${record.existingCustomer ? '<span class="badge badge-success">Yes</span>' : '<span class="badge">No</span>'}</span></div>
        </div>
      </div>

      <div class="profile-section">
        <div class="section-header" data-section="booking">
          <i class="ri-calendar-check-fill"></i>
          <span>Booking Details</span>
          <i class="ri-arrow-down-s-line toggle-icon"></i>
        </div>
        <div class="section-content" id="section-booking">
          <div class="data-row"><span class="data-label">Job Type:</span><span class="data-value">${record.jobType ? `<span class="badge">${record.jobType}</span>` : '—'}</span></div>
          <div class="data-row"><span class="data-label">Job ID:</span><span class="data-value">${record.jobId || '—'}</span></div>
          <div class="data-row"><span class="data-label">Bookable:</span><span class="data-value">${record.bookable === 'Bookable' ? '<span class="badge badge-success">Bookable</span>' : record.bookable ? `<span class="badge badge-error">${record.bookable}</span>` : '—'}</span></div>
          <div class="data-row"><span class="data-label">Appointment:</span><span class="data-value">${record.appointmentTime || '—'}</span></div>
          <div class="data-row"><span class="data-label">Not Booked Reason:</span><span class="data-value">${record.notBookedReasons ? `<span class="badge badge-warning">${record.notBookedReasons}</span>` : '—'}</span></div>
          <div class="data-row"><span class="data-label">Duration:</span><span class="data-value">${duration}</span></div>
        </div>
      </div>

      <div class="profile-section">
        <div class="section-header" data-section="attribution">
          <i class="ri-advertisement-fill"></i>
          <span>Attribution & Marketing</span>
          <i class="ri-arrow-down-s-line toggle-icon"></i>
        </div>
        <div class="section-content" id="section-attribution">
          ${landingPage ? `<div class="data-row"><span class="data-label">Landing Page:</span><span class="data-value"><img src="${this.getLogoUrl(landingPage)}" class="domain-logo" onerror="this.style.display='none'"><a href="${landingPage}" class="profile-link" target="_blank">${landingPage}</a></span></div>` : ''}
          ${referrer ? `<div class="data-row"><span class="data-label">Referrer:</span><span class="data-value"><img src="${this.getLogoUrl(referrer)}" class="domain-logo" onerror="this.style.display='none'"><a href="${referrer}" class="profile-link" target="_blank">${referrer}</a></span></div>` : ''}
          ${utmSource ? `<div class="data-row"><span class="data-label">UTM Source:</span><span class="data-value"><img src="${this.getLogoUrl(utmSource + '.com')}" class="domain-logo" onerror="this.style.display='none'"><span class="badge badge-utm">${utmSource}</span></span></div>` : ''}
          ${utmMedium ? `<div class="data-row"><span class="data-label">UTM Medium:</span><span class="data-value"><span class="badge badge-utm">${utmMedium}</span></span></div>` : ''}
          ${utmCampaign ? `<div class="data-row"><span class="data-label">UTM Campaign:</span><span class="data-value"><span class="badge badge-utm">${utmCampaign}</span></span></div>` : ''}
          ${record.webSession?.attribution?.gclid ? `<div class="data-row"><span class="data-label">Google Click ID:</span><span class="data-value"><img src="${this.getLogoUrl('google.com')}" class="domain-logo"><code>${record.webSession.attribution.gclid}</code></span></div>` : ''}
          ${record.webSession?.attribution?.fbclid ? `<div class="data-row"><span class="data-label">Facebook Click ID:</span><span class="data-value"><img src="${this.getLogoUrl('facebook.com')}" class="domain-logo"><code>${record.webSession.attribution.fbclid}</code></span></div>` : ''}
          ${record.webSession?.attribution?.ga_client_id ? `<div class="data-row"><span class="data-label">GA Client ID:</span><span class="data-value"><code>${record.webSession.attribution.ga_client_id}</code></span></div>` : ''}
          ${!landingPage && !referrer && !utmSource && !utmMedium && !utmCampaign ? '<div class="data-row"><span class="data-value" style="color: var(--color-text-muted);">No attribution data available</span></div>' : ''}
        </div>
      </div>

      <div class="profile-section">
        <div class="section-header" data-section="technical">
          <i class="ri-code-box-fill"></i>
          <span>Technical Details</span>
          <i class="ri-arrow-down-s-line toggle-icon"></i>
        </div>
        <div class="section-content collapsed" id="section-technical">
          <div class="data-row"><span class="data-label">User ID:</span><span class="data-value"><code>${record.userId || '—'}</code></span></div>
          <div class="data-row"><span class="data-label">Transcript ID:</span><span class="data-value"><code>${record.transcriptId || '—'}</code></span></div>
          <div class="data-row"><span class="data-label">DB ID:</span><span class="data-value">${record.DBId || '—'}</span></div>
          <div class="data-row"><span class="data-label">Customer ID:</span><span class="data-value">${record.customerId || '—'}</span></div>
          <div class="data-row"><span class="data-label">Location ID:</span><span class="data-value">${record.locationId || '—'}</span></div>
          <div class="data-row"><span class="data-label">Market:</span><span class="data-value">${record.s2fId || '—'}</span></div>
          <div class="data-row"><span class="data-label">Source:</span><span class="data-value">${record.source ? `<span class="badge">${record.source}</span>` : '—'}</span></div>
          <div class="data-row"><span class="data-label">Timezone:</span><span class="data-value">${record.webSession?.temporal?.timezone || '—'}</span></div>
          <div class="data-row"><span class="data-label">Browser:</span><span class="data-value">${record.webSession?.browser?.platform || '—'}</span></div>
          <div class="data-row"><span class="data-label">Updated At:</span><span class="data-value">${record.UpdatedAt || '—'}</span></div>
        </div>
      </div>
    `;
  }

  private openProfileDrawer(record: ChatRecord) {
    const drawer = this.root.querySelector('#profile-drawer') as HTMLElement;
    const overlay = this.root.querySelector('#profile-overlay') as HTMLElement;
    const profileContent = this.root.querySelector('#profile-content');

    if (!drawer || !overlay || !profileContent) return;

    // Render profile content
    profileContent.innerHTML = this.renderProfileDrawer(record);

    // Add collapsible section functionality
    const sectionHeaders = profileContent.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const sectionId = header.getAttribute('data-section');
        const content = profileContent.querySelector(`#section-${sectionId}`);
        if (content) {
          content.classList.toggle('collapsed');
          header.querySelector('.toggle-icon')?.classList.toggle('rotated');
        }
      });
    });

    // Show drawer and overlay
    overlay.style.display = 'block';
    drawer.classList.add('open');
  }

  private closeProfileDrawer() {
    const drawer = this.root.querySelector('#profile-drawer') as HTMLElement;
    const overlay = this.root.querySelector('#profile-overlay') as HTMLElement;

    if (drawer && overlay) {
      drawer.classList.remove('open');
      overlay.style.display = 'none';
    }
  }


  private getStyles(): string {
    // Styles are now injected globally by index.ts
    // No need to inject them here
    return '';
  }
}

// Register the custom element
customElements.define('s2f-analytics-dashboard', AnalyticsDashboard);
