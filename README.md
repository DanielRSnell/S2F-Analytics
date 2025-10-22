# S2F Analytics Dashboard

A high-fidelity analytics dashboard web component for tracking and analyzing chat conversations, bookings, and customer interactions. Built with TypeScript, AG Grid, and modern web standards.

📖 **[View Documentation](./docs.html)** - Complete integration guide with code examples

## Features

### Analytics & Reporting
- **Real-time KPIs**: Total chats, conversion rates, average duration, revenue opportunities
- **Channel Performance**: SMS, Voice, and Web chat analytics with conversion tracking
- **Attribution Analytics**: Track performance by marketing source (Google, Bing, GMB, Facebook, etc.)
- **Job Type Analysis**: Detailed breakdown of booking performance by service type
- **Customer Insights**: New vs existing customer metrics

### Interactive Data Table
- **Advanced Filtering**: Filter by booking status, customer type, completion status
- **Attribution Source Filter**: Filter by marketing channel (Bing, Google Ads, Business Profile, etc.)
- **Date Range Filtering**: Custom date range selection for historical analysis
- **Column Management**: Show/hide columns dynamically
- **Search & Sort**: Full-text search and multi-column sorting
- **Transcript Viewer**: Built-in drawer to view conversation transcripts with markdown support
- **Profile Drawer**: Detailed customer profile view with contact information

### Design
- **Dark Theme**: Professional dark mode interface with gradient accents
- **Responsive Layout**: Optimized for desktop and mobile devices
- **High Fidelity UI**: Polished cards, gradients, and micro-interactions
- **Logo Integration**: Automatic brand logos via Logo.dev API

## Technology Stack

- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **AG Grid Community** - Enterprise-grade data table
- **Marked** - Markdown rendering for transcripts
- **RemixIcon** - Beautiful icon set
- **Web Components** - Shadow DOM encapsulation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- NocoDB instance (or use mock data for development)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
# NocoDB API Configuration
VITE_NOCODB_BASE_URL=https://your-nocodb-instance.com/api/v2/tables/YOUR_TABLE_ID/records
VITE_NOCODB_API_TOKEN=your_api_token_here

# Use mock data for development (set to 'true' for mock data)
VITE_USE_MOCK_DATA=false
```

### Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to view the dashboard.

### Production Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deployment

### Deploy to Netlify

#### Option 1: Using Netlify CLI

1. Install Netlify CLI globally:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Deploy:
```bash
netlify deploy --prod
```

#### Option 2: Using Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your Git repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add environment variables in Netlify dashboard:
   - `VITE_NOCODB_BASE_URL`
   - `VITE_NOCODB_API_TOKEN`
   - `VITE_USE_MOCK_DATA`
7. Click "Deploy site"

#### Option 3: Drag & Drop

1. Build the project locally:
```bash
npm run build
```

2. Go to [Netlify](https://app.netlify.com)
3. Drag and drop the `dist` folder to deploy

The project includes a `netlify.toml` configuration file that handles build settings and redirects automatically.

## Usage

### As a Web Component

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="./dist/s2f-analytics.js"></script>
</head>
<body>
  <!-- Mount the dashboard with a market ID -->
  <s2f-analytics-dashboard s2fid="pd-northern-nj"></s2f-analytics-dashboard>
</body>
</html>
```

### Component Attributes

- `s2fid` (required) - Market identifier for filtering data (e.g., "pd-northern-nj")

## Data Structure

The dashboard expects chat records with the following structure:

```typescript
interface ChatRecord {
  Id: number;
  userId: string;
  transcript: string | null;
  s2fId: string;                    // Market ID
  jobType: string | null;           // Service type
  timeStamp: string | null;         // ISO datetime
  jobId: string | null;             // Booking ID (null = not booked)
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  email: string | null;
  source: string | null;            // Channel: SMS, Voice, Webchat
  duration: number | null;          // Call/chat duration in seconds
  existingCustomer: boolean;
  bookable: string | null;          // "Bookable", "Not Bookable - Incomplete Conversation", etc.
  webSession: {
    utm: {
      utm_source: string | null;    // Attribution source: google, bing, gmb, etc.
      utm_medium: string | null;
      utm_campaign: string | null;
      // ... other UTM parameters
    };
    // ... other web session data
  };
}
```

See [mock/columns.md](mock/columns.md) for complete field documentation.

## NocoDB API Integration

The dashboard uses NocoDB REST API v2 with query parameter syntax:

### Query Format

```
GET /api/v2/tables/{tableId}/records?where=(field,operator,value)~and(field2,operator,value2)
```

### Supported Operators

- `eq` - Equals
- `ge` - Greater than or equal
- `le` - Less than or equal
- `lt` - Less than

### Date Filtering

Date queries use the `exactDate` sub-operator:

```
?where=(timeStamp,ge,exactDate,2025-01-01)~and(timeStamp,lt,exactDate,2025-02-01)
```

## Filter Buttons

The dashboard includes pre-configured filter buttons:

- **All Chats** - Show all conversations
- **Booked** - Conversations with scheduled appointments (jobId exists)
- **Revenue Opportunities** - Bookable conversations not yet booked
- **Incomplete** - Conversations marked as incomplete
- **Existing Customers** - Returning customers
- **New Customers** - First-time customers

## Project Structure

```
s2f-analytics/
├── src/
│   ├── components/
│   │   └── AnalyticsDashboard.ts    # Main dashboard component
│   ├── services/
│   │   └── dataService.ts           # API client & analytics engine
│   ├── styles/
│   │   └── dashboard.css            # Component styles
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   └── main.ts                      # Entry point
├── mock/
│   ├── data/
│   │   └── response.json            # Mock data for development
│   └── columns.md                   # Data field documentation
├── index.html                       # Demo page
└── vite.config.ts                   # Build configuration
```

## Customization

### Styling

The dashboard uses CSS custom properties for theming. Override these in your global styles:

```css
:root {
  --color-primary: #3fb4b8;
  --color-accent: #2dd4bf;
  --color-background: #0f172a;
  --color-card: #1e293b;
  /* ... more variables */
}
```

### Logo.dev Integration

Traffic source cards automatically fetch brand logos using Logo.dev. Update the API token in [AnalyticsDashboard.ts:525](src/components/AnalyticsDashboard.ts#L525):

```typescript
const logoUrl = `https://img.logo.dev/${normalized.domain}?token=YOUR_TOKEN_HERE`;
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires native support for:
- Web Components (Custom Elements v1)
- Shadow DOM
- ES2020 features

## License

MIT

## Support

For issues or questions, please contact the development team.
