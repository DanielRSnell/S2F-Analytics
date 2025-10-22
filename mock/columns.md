# Description of Column Headers

This document outlines and describes the column headers found in the JSON data.

## Top-Level Fields

- **Id**: A unique numerical identifier for each record in the list.
- **CreatedAt**: The timestamp indicating when the record was initially created.
- **UpdatedAt**: The timestamp indicating the last time the record was updated.
- **userId**: A unique identifier for the user interacting with the system.
- **transcript**: The full text transcript of the conversation, if one occurred. This field can be null.
- **s2fId**: An identifier for the specific market location, in this case, pd-northern-nj.
- **jobType**: The type of job requested by the user (e.g., "repair"). This can be null if not specified.
- **zipCode**: The postal code provided by the user.
- **timeStamp**: A timestamp related to when the record was initially created.
- **rawAvailability**: An object containing raw, unprocessed appointment availability data, indexed by UTC time slots.
- **readableAvailability**: An object containing appointment availability data that has been formatted to be easily read by humans.
- **jobId**: The unique identifier for a job if an appointment was successfully booked.
- **firstName**: The first name of the customer.
- **lastName**: The last name of the customer.
- **phoneNumber**: The customer's phone number.
- **email**: The customer's email address.
- **streetAddress**: The street address for the appointment.
- **city**: The city for the appointment.
- **state**: The state for the appointment.
- **appointmentTime**: The scheduled time for the appointment, presented in a readable format.
- **webSession**: An object containing detailed information about the user's web session. (See details below).
- **termsOfService**: Indicates whether the terms of service were accepted.
- **customerId**: A unique identifier for the customer if they exist in the system.
- **locationId**: A unique identifier for the service location.
- **transcriptId**: A unique identifier for the conversation transcript.
- **DBId**: The database identifier for the record.
- **source**: The source of the interaction or lead.
- **timeZoneMarket**: The market's time zone.
- **duration**: The duration of the interaction.
- **credits**: Any credits associated with the record.
- **teamNotes**: Notes made by the team regarding this interaction.
- **existingCustomer**: A boolean value (true/false) indicating if the user is an existing customer.
- **bookable**: A status indicating if the interaction resulted in a bookable appointment (e.g., "Bookable", "Not Bookable - Incomplete Conversation").
- **notBookedReasons**: If a job was considered "bookable" but did not result in a booking, the reasons why an appointment was not booked.

---

## Web Session Details (webSession)

This section breaks down the fields contained within the webSession object.

### Attribution (attribution)

Details about the source of the web traffic.

- **gclid**: Google Click Identifier, used for tracking clicks from Google Ads.
- **fbclid**: Facebook Click Identifier, for tracking clicks from Facebook.
- **msclkid**: Microsoft Click ID, for tracking clicks from Bing Ads.
- **gbraid**: Google's identifier for tracking clicks from app campaigns.
- **wbraid**: Google's identifier for tracking clicks from web campaigns.
- **landing_page**: The first page the user visited in their session.
- **original_referrer**: The initial referrer for the user's session.
- **referrer**: The URL of the page that linked the user to the current page.
- **ga_client_id**: The Google Analytics client ID for the user.
- **referral**: Information about the referral source.
- **reschedule_job_id**: The ID of a job being rescheduled, if applicable.

### UTM Parameters (utm)

Urchin Tracking Module parameters for marketing campaign tracking.

- **utm_source**: The source of the traffic (e.g., google, bing).
- **utm_medium**: The medium used (e.g., cpc, organic).
- **utm_campaign**: The specific marketing campaign name.
- **utm_term**: The keyword used for the ad.
- **utm_content**: The specific ad content that was clicked.
- **utm_adgroup**: The ad group associated with the click.

### Page Information (page)

Details about the web page being viewed.

- **current_domain**: The domain of the current page (e.g., pdsnj.com).
- **current_url**: The full URL of the page.
- **pathname**: The path of the URL (e.g., /garage-door-repair).
- **search**: The query string part of the URL.
- **hash**: The fragment identifier (#) part of the URL.
- **params**: An object containing the key-value pairs from the URL's query string.

### Browser Information (browser)

Information about the user's web browser.

- **user_agent**: The user-agent string of the browser.
- **platform**: The operating system platform (e.g., Win32, iPhone).
- **language**: The primary language of the browser.
- **languages**: An array of languages supported by the browser.
- **cookies_enabled**: A boolean indicating if cookies are enabled.
- **online_status**: A boolean indicating the browser's online status.
- **do_not_track**: The user's "Do Not Track" preference.

### Display Information (display)

Details about the user's screen and display settings.

- **screen_width**: The width of the screen in pixels.
- **screen_height**: The height of the screen in pixels.
- **screen_color_depth**: The color depth of the screen.
- **viewport_width**: The width of the browser's viewport.
- **viewport_height**: The height of the browser's viewport.
- **device_pixel_ratio**: The ratio of physical pixels to logical pixels.

### Temporal Information (temporal)

Time-related data for the session.

- **timezone**: The user's timezone (e.g., America/New_York).
- **timezone_offset**: The timezone offset in minutes from UTC.
- **timestamp**: The UTC timestamp of the event.
- **page_load_time**: The time it took for the page to load, in milliseconds.

### Capabilities (capabilities)

Information about the browser's and connection's capabilities.

- **session_storage_available**: A boolean indicating if session storage is available.
- **local_storage_available**: A boolean indicating if local storage is available.
- **connection_type**: The type of network connection (e.g., 4g).
- **connection_downlink**: The effective bandwidth of the connection in megabits per second.
