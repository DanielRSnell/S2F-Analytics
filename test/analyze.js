#!/usr/bin/env node

/**
 * WebSession Data Analysis Script
 *
 * This script analyzes the production response.json data and generates
 * a markdown report showing how the analytics are calculated.
 */

const fs = require("fs");
const path = require("path");

// Read the production data
const dataPath = path.join(__dirname, "../mock/data/response.json");
const rawData = fs.readFileSync(dataPath, "utf8");
const data = JSON.parse(rawData);
const records = data.list;

console.log(`📊 Analyzing ${records.length} chat records...\n`);

// Initialize analytics
const analytics = {
  totalChats: records.length,
  bookableChats: 0,
  bookedChats: 0,
  utmSourceMap: new Map(),
  channelMap: new Map(),
  jobTypeMap: new Map(),
  directTraffic: 0,
  paidTraffic: 0,
  existingCustomers: 0,
  newCustomers: 0,
  incompleteConversations: 0,
  clickIds: {
    gclid: 0,
    fbclid: 0,
    msclkid: 0,
  },
  noWebSession: 0,
  noUtmData: 0,
  referrerDomains: new Map(),
};

// Process each record
records.forEach((record, index) => {
  const isBooked =
    record.jobId !== null && record.jobId !== undefined && record.jobId !== "";
  const isBookable = record.bookable === "Bookable";

  if (isBookable) analytics.bookableChats++;
  if (isBooked) analytics.bookedChats++;

  // Existing vs New customers
  if (record.existingCustomer) analytics.existingCustomers++;
  else analytics.newCustomers++;

  // Incomplete conversations
  if (record.bookable && record.bookable.includes("Incomplete")) {
    analytics.incompleteConversations++;
  }

  // Channel analysis (source field)
  const channel = record.source || "Unknown";
  const channelStats = analytics.channelMap.get(channel) || {
    total: 0,
    booked: 0,
  };
  channelStats.total++;
  if (isBooked) channelStats.booked++;
  analytics.channelMap.set(channel, channelStats);

  // Job type analysis
  if (record.jobType) {
    const jobStats = analytics.jobTypeMap.get(record.jobType) || {
      total: 0,
      booked: 0,
    };
    jobStats.total++;
    if (isBooked) jobStats.booked++;
    analytics.jobTypeMap.set(record.jobType, jobStats);
  }

  // WebSession analysis
  const session = record.webSession;
  if (!session) {
    analytics.noWebSession++;
    return;
  }

  // UTM Source tracking - override with referrer based on patterns
  let utmSource = session.utm?.utm_source;

  // Check referrer and override utm_source if needed
  const referrer = session.attribution?.referrer;
  if (referrer) {
    const lowerReferrer = referrer.toLowerCase();

    // Check for Yahoo
    if (
      lowerReferrer.includes("yahoo.com") ||
      lowerReferrer.includes("search.yahoo")
    ) {
      utmSource = "yahoo";
    }
    // Check for Precision Door domains (pd or precision in domain)
    else if (
      lowerReferrer.includes("precisiondoor") ||
      lowerReferrer.includes("precision-door") ||
      (lowerReferrer.includes("pd") &&
        (lowerReferrer.includes(".com") || lowerReferrer.includes(".net")))
    ) {
      utmSource = "precision-door";
    }
  }

  if (utmSource) {
    const stats = analytics.utmSourceMap.get(utmSource) || {
      total: 0,
      booked: 0,
    };
    stats.total++;
    if (isBooked) stats.booked++;
    analytics.utmSourceMap.set(utmSource, stats);
    analytics.paidTraffic++;
  } else {
    analytics.directTraffic++;
    analytics.noUtmData++;
  }

  // Click ID tracking
  const attribution = session.attribution;
  if (attribution) {
    if (attribution.gclid) analytics.clickIds.gclid++;
    if (attribution.fbclid) analytics.clickIds.fbclid++;
    if (attribution.msclkid) analytics.clickIds.msclkid++;

    // Referrer tracking
    const referrer = attribution.referrer;
    if (referrer && referrer !== "direct" && referrer !== "") {
      try {
        const url = new URL(referrer);
        const domain = url.hostname.replace("www.", "");
        const count = analytics.referrerDomains.get(domain) || 0;
        analytics.referrerDomains.set(domain, count + 1);
      } catch (e) {
        // Invalid URL, skip
      }
    }
  }
});

// Calculate rates
const conversionRate =
  analytics.totalChats > 0
    ? (analytics.bookedChats / analytics.totalChats) * 100
    : 0;
const bookableRate =
  analytics.totalChats > 0
    ? (analytics.bookableChats / analytics.totalChats) * 100
    : 0;
const bookingRate =
  analytics.bookableChats > 0
    ? (analytics.bookedChats / analytics.bookableChats) * 100
    : 0;

// Generate markdown report
let markdown = `# WebSession Data Analysis Report

**Generated:** ${new Date().toLocaleString()}
**Total Records Analyzed:** ${analytics.totalChats}

---

## 📊 Key Performance Indicators

| Metric | Value | Percentage |
|--------|-------|------------|
| **Total Chats** | ${analytics.totalChats} | 100% |
| **Bookable Chats** | ${analytics.bookableChats} | ${bookableRate.toFixed(1)}% |
| **Booked Chats** | ${analytics.bookedChats} | ${conversionRate.toFixed(1)}% |
| **Conversion Rate** | ${conversionRate.toFixed(1)}% | (Booked / Total) |
| **Booking Rate** | ${bookingRate.toFixed(1)}% | (Booked / Bookable) |
| **Revenue Opportunities** | ${analytics.bookableChats - analytics.bookedChats} | (Bookable but not Booked) |

---

## 🔍 Attribution Analysis

### Traffic Split

| Type | Count | Percentage |
|------|-------|------------|
| **Direct Traffic** | ${analytics.directTraffic} | ${analytics.totalChats > 0 ? ((analytics.directTraffic / analytics.totalChats) * 100).toFixed(1) : 0}% |
| **Paid Traffic** | ${analytics.paidTraffic} | ${analytics.totalChats > 0 ? ((analytics.paidTraffic / analytics.totalChats) * 100).toFixed(1) : 0}% |

### UTM Source Breakdown

${analytics.utmSourceMap.size === 0 ? "_No UTM source data found in records_" : ""}

| UTM Source | Total Chats | Booked | Conv. Rate |
|------------|-------------|--------|------------|
${Array.from(analytics.utmSourceMap.entries())
  .sort((a, b) => b[1].total - a[1].total)
  .map(([source, stats]) => {
    const convRate = stats.total > 0 ? (stats.booked / stats.total) * 100 : 0;
    return `| ${source} | ${stats.total} | ${stats.booked} | ${convRate.toFixed(1)}% |`;
  })
  .join("\n")}

### Click ID Distribution

| Platform | Count |
|----------|-------|
| **Google Ads (gclid)** | ${analytics.clickIds.gclid} |
| **Facebook Ads (fbclid)** | ${analytics.clickIds.fbclid} |
| **Microsoft Ads (msclkid)** | ${analytics.clickIds.msclkid} |

### Top Referrer Domains

${analytics.referrerDomains.size === 0 ? "_No referrer data found_" : ""}

| Domain | Count |
|--------|-------|
${Array.from(analytics.referrerDomains.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([domain, count]) => `| ${domain} | ${count} |`)
  .join("\n")}

---

## 📱 Channel Performance

| Channel | Total Chats | Booked | Conv. Rate | Share |
|---------|-------------|--------|------------|-------|
${Array.from(analytics.channelMap.entries())
  .sort((a, b) => b[1].total - a[1].total)
  .map(([channel, stats]) => {
    const convRate = stats.total > 0 ? (stats.booked / stats.total) * 100 : 0;
    const share =
      analytics.totalChats > 0 ? (stats.total / analytics.totalChats) * 100 : 0;
    return `| ${channel} | ${stats.total} | ${stats.booked} | ${convRate.toFixed(1)}% | ${share.toFixed(1)}% |`;
  })
  .join("\n")}

---

## 🔧 Job Type Performance

| Job Type | Total | Booked | Conv. Rate |
|----------|-------|--------|------------|
${Array.from(analytics.jobTypeMap.entries())
  .sort((a, b) => b[1].total - a[1].total)
  .slice(0, 10)
  .map(([jobType, stats]) => {
    const convRate = stats.total > 0 ? (stats.booked / stats.total) * 100 : 0;
    return `| ${jobType || "Unknown"} | ${stats.total} | ${stats.booked} | ${convRate.toFixed(1)}% |`;
  })
  .join("\n")}

---

## 👥 Customer Insights

| Type | Count | Percentage |
|------|-------|------------|
| **New Customers** | ${analytics.newCustomers} | ${analytics.totalChats > 0 ? ((analytics.newCustomers / analytics.totalChats) * 100).toFixed(1) : 0}% |
| **Existing Customers** | ${analytics.existingCustomers} | ${analytics.totalChats > 0 ? ((analytics.existingCustomers / analytics.totalChats) * 100).toFixed(1) : 0}% |

---

## ⚠️ Data Quality Issues

| Issue | Count | Notes |
|-------|-------|-------|
| **No WebSession Data** | ${analytics.noWebSession} | Records missing webSession object |
| **No UTM Data** | ${analytics.noUtmData} | Records with null utm_source (Direct Traffic) |
| **Incomplete Conversations** | ${analytics.incompleteConversations} | Conversations marked as incomplete |

---

## 🔬 Sample WebSession Objects

### Record with UTM Data
\`\`\`json
${JSON.stringify(records.find((r) => r.webSession?.utm?.utm_source)?.webSession || "None found", null, 2)}
\`\`\`

### Record without UTM Data (Direct Traffic)
\`\`\`json
${JSON.stringify(records.find((r) => !r.webSession?.utm?.utm_source)?.webSession || "None found", null, 2)}
\`\`\`

---

## 📝 Notes

- **Traffic Source Calculation:** Uses \`webSession.utm.utm_source\` field
- **Direct Traffic:** Records where \`utm_source\` is null or undefined
- **Paid Traffic:** Records with any \`utm_source\` value
- **Channel:** Uses the \`source\` field (SMS, Voice, Webchat)
- **Booked:** Records where \`jobId\` is not null/empty
- **Bookable:** Records where \`bookable\` field equals "Bookable"

This report matches the analytics shown in the S2F Analytics Dashboard.
`;

// Write markdown file
const outputPath = path.join(__dirname, "analysis-report.md");
fs.writeFileSync(outputPath, markdown, "utf8");

console.log("✅ Analysis complete!");
console.log(`📄 Report generated: ${outputPath}\n`);

// Print summary to console
console.log("Summary:");
console.log(`- Total Chats: ${analytics.totalChats}`);
console.log(
  `- Booked: ${analytics.bookedChats} (${conversionRate.toFixed(1)}%)`,
);
console.log(`- Direct Traffic: ${analytics.directTraffic}`);
console.log(`- Paid Traffic: ${analytics.paidTraffic}`);
console.log(`- UTM Sources Found: ${analytics.utmSourceMap.size}`);
console.log(
  `- Channels: ${Array.from(analytics.channelMap.keys()).join(", ")}`,
);
