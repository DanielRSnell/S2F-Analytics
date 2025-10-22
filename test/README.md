# Analytics Testing & Validation

This folder contains tools for analyzing and validating the analytics calculations used in the S2F Analytics Dashboard.

## Quick Start

Run the analysis on your production data:

```bash
node test/analyze.js
```

This will generate a detailed markdown report at `test/analysis-report.md`.

## What It Does

The analysis script:

1. **Reads** the production data from `mock/data/response.json`
2. **Processes** all 665+ chat records using the same logic as the dashboard
3. **Calculates** all analytics metrics:
   - KPIs (total chats, conversion rates, bookable rates)
   - Attribution analysis (UTM sources, direct vs paid traffic)
   - Channel performance (SMS, Voice, Web)
   - Job type breakdown
   - Customer insights (new vs existing)
4. **Generates** a comprehensive markdown report with tables and sample data

## Report Contents

The generated `analysis-report.md` includes:

- **Key Performance Indicators** - Total chats, booking rates, conversion rates
- **Attribution Analysis** - Traffic sources, UTM data, click IDs, referrers
- **Channel Performance** - SMS/Voice/Web breakdown with conversion rates
- **Job Type Performance** - Top services and their booking rates
- **Customer Insights** - New vs existing customer split
- **Data Quality Issues** - Missing webSession data, incomplete conversations
- **Sample WebSession Objects** - Examples of UTM data and direct traffic

## Use Cases

### Verify Dashboard Accuracy

Compare the numbers in the generated report with what's shown in the dashboard to ensure calculations are correct.

### Understand Attribution Logic

See exactly how traffic sources are identified and counted from the `webSession.utm.utm_source` field.

### Audit Data Quality

Review the "Data Quality Issues" section to identify records with missing or incomplete data.

### Debug Analytics

If dashboard numbers look unexpected, run this analysis to see the raw calculations and identify issues.

## How Analytics Work

### Traffic Source Identification

The dashboard identifies traffic sources from `webSession.utm.utm_source`:

```javascript
const utmSource = record.webSession?.utm?.utm_source;
// Examples: "google", "bing", "gmb", "facebook"
```

- **Direct Traffic**: Records where `utm_source` is null
- **Paid Traffic**: Records with any `utm_source` value

### Channel Identification

Channels are identified from the `source` field:

```javascript
const channel = record.source;
// Values: "SMS", "Voice", "Webchat"
```

### Booking Status

A chat is considered "booked" when:

```javascript
const isBooked = record.jobId !== null && record.jobId !== "";
```

### Bookable Status

A chat is "bookable" when:

```javascript
const isBookable = record.bookable === "Bookable";
```

## Files

- `analyze.js` - Main analysis script
- `analysis-report.md` - Generated markdown report (created when you run the script)
- `README.md` - This file

## Customization

To analyze different data, update the path in `analyze.js`:

```javascript
const dataPath = path.join(__dirname, "../path/to/your/data.json");
```

The data must follow the same structure as `mock/data/response.json`.
