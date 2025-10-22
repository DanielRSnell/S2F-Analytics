# WebSession Data Analysis Report

**Generated:** 10/22/2025, 7:49:41 AM
**Total Records Analyzed:** 665

---

## 📊 Key Performance Indicators

| Metric                    | Value | Percentage                |
| ------------------------- | ----- | ------------------------- |
| **Total Chats**           | 665   | 100%                      |
| **Bookable Chats**        | 308   | 46.3%                     |
| **Booked Chats**          | 134   | 20.2%                     |
| **Conversion Rate**       | 20.2% | (Booked / Total)          |
| **Booking Rate**          | 43.5% | (Booked / Bookable)       |
| **Revenue Opportunities** | 174   | (Bookable but not Booked) |

---

## 🔍 Attribution Analysis

### Traffic Split

| Type               | Count | Percentage |
| ------------------ | ----- | ---------- |
| **Direct Traffic** | 97    | 14.6%      |
| **Paid Traffic**   | 568   | 85.4%      |

### UTM Source Breakdown

| UTM Source     | Total Chats | Booked | Conv. Rate |
| -------------- | ----------- | ------ | ---------- |
| precision-door | 261         | 69     | 26.4%      |
| yahoo          | 191         | 0      | 0.0%       |
| google         | 76          | 18     | 23.7%      |
| gmb            | 14          | 3      | 21.4%      |
| bing           | 11          | 5      | 45.5%      |
| GMBListing     | 9           | 6      | 66.7%      |
| facebook       | 3           | 0      | 0.0%       |
| Facebook       | 2           | 0      | 0.0%       |
| chatgpt.com    | 1           | 1      | 100.0%     |

### Click ID Distribution

| Platform                    | Count |
| --------------------------- | ----- |
| **Google Ads (gclid)**      | 196   |
| **Facebook Ads (fbclid)**   | 6     |
| **Microsoft Ads (msclkid)** | 239   |

### Top Referrer Domains

| Domain                        | Count |
| ----------------------------- | ----- |
| pdsnj.com                     | 259   |
| search.yahoo.com              | 190   |
| google.com                    | 152   |
| bing.com                      | 12    |
| youtube.com                   | 9     |
| googleads.g.doubleclick.net   | 4     |
| deals.allinfohome.com         | 3     |
| duckduckgo.com                | 3     |
| m.facebook.com                | 3     |
| precisiondoorhudsonvalley.com | 2     |

---

## 📱 Channel Performance

| Channel | Total Chats | Booked | Conv. Rate | Share |
| ------- | ----------- | ------ | ---------- | ----- |
| Unknown | 432         | 75     | 17.4%      | 65.0% |
| Webchat | 226         | 59     | 26.1%      | 34.0% |
| Voice   | 6           | 0      | 0.0%       | 0.9%  |
| SMS     | 1           | 0      | 0.0%       | 0.2%  |

---

## 🔧 Job Type Performance

| Job Type                   | Total | Booked | Conv. Rate |
| -------------------------- | ----- | ------ | ---------- |
| repair                     | 141   | 92     | 65.2%      |
| door-estimate              | 38    | 23     | 60.5%      |
| openers                    | 27    | 18     | 66.7%      |
| commercial-new-garage-door | 2     | 1      | 50.0%      |

---

## 👥 Customer Insights

| Type                   | Count | Percentage |
| ---------------------- | ----- | ---------- |
| **New Customers**      | 657   | 98.8%      |
| **Existing Customers** | 8     | 1.2%       |

---

## ⚠️ Data Quality Issues

| Issue                        | Count | Notes                                         |
| ---------------------------- | ----- | --------------------------------------------- |
| **No WebSession Data**       | 0     | Records missing webSession object             |
| **No UTM Data**              | 97    | Records with null utm_source (Direct Traffic) |
| **Incomplete Conversations** | 210   | Conversations marked as incomplete            |

---

## 🔬 Sample WebSession Objects

### Record with UTM Data

```json
{
  "attribution": {
    "gclid": null,
    "fbclid": null,
    "msclkid": "392647524938142fb9332fd30a2cde74",
    "gbraid": null,
    "wbraid": null,
    "landing_page": "https://pdsnj.com/garage-door-repair?AdGroup=Garage%20Door%20Repair%20(Phrase%20Match)&AdGroupId=1177578790635781&AdId=73598881440151&Campaign=NJ%20IP%20Residential%3A%20Garage%20Door%20Repair%23&CampaignId=361276227&Network=o&identifiers=kwd-73599085914401:loc-58320&msclkid=19e725e192c31e59bae34d60d37e1631&utm_source=bing&utm_medium=cpc&utm_campaign=NJ%20IP%20Residential%3A%20Garage%20Door%20Repair%23&utm_term=repair%20garage%20door&utm_content=Garage%20Door%20Repair%20(Phrase%20Match)",
    "original_referrer": "https://search.yahoo.com/",
    "referrer": "https://search.yahoo.com/",
    "ga_client_id": "1678880335.1753301440",
    "referral": "",
    "reschedule_job_id": ""
  },
  "utm": {
    "utm_source": "bing",
    "utm_medium": "cpc",
    "utm_campaign": "NJ IP Residential: Garage Door Repair#",
    "utm_term": "garage door repair",
    "utm_content": "Garage Door Repair (Phrase Match)",
    "utm_adgroup": null
  },
  "page": {
    "current_domain": "pdsnj.com",
    "current_url": "https://pdsnj.com/garage-door-repair?AdGroup=Garage%20Door%20Repair%20(Phrase%20Match)&AdGroupId=1177578790635781&AdId=73598881440151&Campaign=NJ%20IP%20Residential%3A%20Garage%20Door%20Repair%23&CampaignId=361276227&Network=o&identifiers=kwd-73599085914398:loc-58320&msclkid=392647524938142fb9332fd30a2cde74&utm_source=bing&utm_medium=cpc&utm_campaign=NJ%20IP%20Residential%3A%20Garage%20Door%20Repair%23&utm_term=garage%20door%20repair&utm_content=Garage%20Door%20Repair%20(Phrase%20Match)",
    "pathname": "/garage-door-repair",
    "search": "?AdGroup=Garage%20Door%20Repair%20(Phrase%20Match)&AdGroupId=1177578790635781&AdId=73598881440151&Campaign=NJ%20IP%20Residential%3A%20Garage%20Door%20Repair%23&CampaignId=361276227&Network=o&identifiers=kwd-73599085914398:loc-58320&msclkid=392647524938142fb9332fd30a2cde74&utm_source=bing&utm_medium=cpc&utm_campaign=NJ%20IP%20Residential%3A%20Garage%20Door%20Repair%23&utm_term=garage%20door%20repair&utm_content=Garage%20Door%20Repair%20(Phrase%20Match)",
    "hash": "",
    "params": {
      "AdGroup": "Garage Door Repair (Phrase Match)",
      "AdGroupId": "1177578790635781",
      "AdId": "73598881440151",
      "Campaign": "NJ IP Residential: Garage Door Repair#",
      "CampaignId": "361276227",
      "Network": "o",
      "identifiers": "kwd-73599085914398:loc-58320",
      "msclkid": "392647524938142fb9332fd30a2cde74",
      "utm_source": "bing",
      "utm_medium": "cpc",
      "utm_campaign": "NJ IP Residential: Garage Door Repair#",
      "utm_term": "garage door repair",
      "utm_content": "Garage Door Repair (Phrase Match)"
    }
  },
  "browser": {
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "platform": "iPhone",
    "language": "en-US",
    "languages": ["en-US"],
    "cookies_enabled": true,
    "online_status": true
  },
  "display": {
    "screen_width": 390,
    "screen_height": 844,
    "screen_color_depth": 24,
    "viewport_width": 390,
    "viewport_height": 797,
    "device_pixel_ratio": 3
  },
  "temporal": {
    "timezone": "America/New_York",
    "timezone_offset": 240,
    "timestamp": "2025-07-23T20:16:28.938Z",
    "page_load_time": 7576.000000000001
  },
  "capabilities": {
    "session_storage_available": true,
    "local_storage_available": true,
    "connection_type": null,
    "connection_downlink": null
  }
}
```

### Record without UTM Data (Direct Traffic)

```json
{
  "attribution": {
    "gclid": null,
    "fbclid": null,
    "msclkid": null,
    "gbraid": null,
    "wbraid": null,
    "landing_page": "https://pdsnj.com/",
    "original_referrer": "https://pdsnj.com/",
    "referrer": "https://pdsnj.com/",
    "ga_client_id": "1318539288.1753293831",
    "referral": "",
    "reschedule_job_id": ""
  },
  "utm": {
    "utm_source": null,
    "utm_medium": null,
    "utm_campaign": null,
    "utm_term": null,
    "utm_content": null,
    "utm_adgroup": null
  },
  "page": {
    "current_domain": "pdsnj.com",
    "current_url": "https://pdsnj.com/",
    "pathname": "/",
    "search": "",
    "hash": "",
    "params": {}
  },
  "browser": {
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "platform": "Win32",
    "language": "en-US",
    "languages": ["en-US"],
    "cookies_enabled": true,
    "online_status": true,
    "do_not_track": null
  },
  "display": {
    "screen_width": 2560,
    "screen_height": 1440,
    "screen_color_depth": 24,
    "viewport_width": 1522,
    "viewport_height": 748,
    "device_pixel_ratio": 1.25
  },
  "temporal": {
    "timezone": "America/New_York",
    "timezone_offset": 240,
    "timestamp": "2025-07-23T19:10:27.435Z",
    "page_load_time": 3563.6000000089407
  },
  "capabilities": {
    "session_storage_available": true,
    "local_storage_available": true,
    "connection_type": "4g",
    "connection_downlink": 10
  }
}
```

---

## 📝 Notes

- **Traffic Source Calculation:** Uses `webSession.utm.utm_source` field
- **Direct Traffic:** Records where `utm_source` is null or undefined
- **Paid Traffic:** Records with any `utm_source` value
- **Channel:** Uses the `source` field (SMS, Voice, Webchat)
- **Booked:** Records where `jobId` is not null/empty
- **Bookable:** Records where `bookable` field equals "Bookable"

This report matches the analytics shown in the S2F Analytics Dashboard.
