function extractLeadsFromGmail() {
  const threads = GmailApp.search(
    'is:unread subject:("Book an appointment" OR "Project enquiry" OR "Download Brochure" OR "Contact Enquiry")',
    0, 20
  );

  const sheet = SpreadsheetApp.openById("1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo").getSheetByName("Leads");
  let newRow = sheet.getLastRow() + 1;

  const lastRowCheck = sheet.getLastRow();
  const existingFingerprints = lastRowCheck > 1
    ? sheet.getRange(2, 2, lastRowCheck - 1, 5).getValues().map(row => {
        const project = row[0]?.toLowerCase().trim();
        const name = row[1]?.toLowerCase().trim();
        const email = row[3]?.toLowerCase().trim();
        const phone = typeof row[4] === 'string' ? row[4].replace(/[^0-9+]/g, '') : '';
        return `${name}|${phone}|${email}|${project}`;
      })
    : [];

  let insertedFingerprints = [];

  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      const subject = message.getSubject();
      const plainBody = message.getPlainBody();
      const htmlBody = message.getBody();
      let lead = {};

      // === Format 1 ===
      if (subject.includes("Download Brochure") && plainBody.includes("Mobile Number:")) {
        lead.source = "Website";
        lead.project = extract(plainBody, "For Project Enquiry:", "\n");
        lead.name = extract(plainBody, "Name:", "\n");
        lead.phone = extract(plainBody, "Mobile Number:", "\n");
        lead.email = "";
        lead.city = "";

      // === Format 2 ===
      } else if (subject.includes("Book an appointment") && plainBody.includes("For Project Enquiry:")) {
        lead.source = "Website";
        lead.project = extract(plainBody, "For Project Enquiry:", "\n");
        lead.name = extract(plainBody, "Your Name:", "\n");
        lead.email = extract(plainBody, "Your Email Id:", "\n");
        lead.phone = extract(plainBody, "Mobile Number:", "\n");
        lead.city = extract(plainBody, "City(Residence):", "\n");

      // === Format 3 ===
      } else if ((subject.includes("Project enquiry") || subject.includes("Write in to us")) && plainBody.includes("E-mail ID:")) {
        lead.source = "Website";
        lead.project = extract(plainBody, "For Project Enquiry:", "\n");
        lead.name = extract(plainBody, "Name:", "\n");
        lead.email = extract(plainBody, "E-mail ID:", "\n");
        lead.phone = extract(plainBody, "Mobile Number:", "\n");
        lead.city = "";

      // === ✅ Format 4 ===
      } else if (subject.includes("Contact Enquiry") && plainBody.includes("Preferred Location:")) {
        lead.source = "Website";
        lead.name = extract(plainBody, "Your Name:", "\n");
        lead.email = extract(plainBody, "Your Email Id:", "\n");
        lead.phone = extract(plainBody, "Mobile Number:", "\n");
        lead.city = extract(plainBody, "City Residence:", "\n");
        const rawLocation = extract(plainBody, "Preferred Location:", "\n");
        lead.project = rawLocation.split("[")[0].trim(); // removes [menu-879]

      } else {
        return;
      }

      const leadFingerprint = `${lead.name.toLowerCase().trim()}|${lead.phone}|${lead.email.toLowerCase().trim()}|${lead.project.toLowerCase().trim()}`;

      if (existingFingerprints.includes(leadFingerprint) || insertedFingerprints.includes(leadFingerprint)) {
        Logger.log("Duplicate lead detected (existing or session): " + leadFingerprint);
        message.markRead();
        return;
      }

      insertedFingerprints.push(leadFingerprint);

      const leadId = "LEAD-" + new Date().getTime();
      sheet.getRange(newRow, 1, 1, 7).setValues([[
        leadId,
        lead.project,
        lead.source,
        lead.name,
        lead.email,
        lead.phone,
        lead.city
      ]]);

      newRow++;
      message.markRead();
    });
  });
}
function removeDuplicatePhonesInLeads() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads");
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return; // No data besides header

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const phoneCol = headers.indexOf("Phone");
  if (phoneCol === -1) {
    Logger.log("Phone column not found");
    return;
  }

  // Get phone value from last row
  const phone = (sheet.getRange(lastRow, phoneCol + 1).getValue() || "").toString().trim();
  if (!phone) return; // Skip if blank

  // Get all phones above the last row
  const abovePhones = sheet.getRange(2, phoneCol + 1, lastRow - 2).getValues().flat().map(p => (p || "").toString().trim());

  // If found above, delete the last row
  if (abovePhones.includes(phone)) {
    sheet.deleteRow(lastRow);
    Logger.log(`Deleted duplicate row ${lastRow} with phone: ${phone}`);
  }
}




function extract(text, start, end) {
  try {
    const s = text.indexOf(start);
    if (s === -1) return "";
    const e = text.indexOf(end, s + start.length);
    return text.substring(s + start.length, e !== -1 ? e : undefined).trim();
  } catch (e) {
    return "";
  }
}


function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  const row = e.range.getRow();
  const col = e.range.getColumn();


  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const editedHeader = headers[col - 1];


  // === 1. LEAD ID Generation ===
  if (sheetName === "Leads") {
    const leadIdCol = 1; // Column A
    const nameCol = 4;   // Column D


    const leadIdCell = sheet.getRange(row, leadIdCol);
    const nameCell = sheet.getRange(row, nameCol);


    if (!leadIdCell.getValue() && nameCell.getValue()) {
      const timestamp = new Date().getTime();
      const leadId = "LEAD-" + timestamp;
      leadIdCell.setValue(leadId);
    }
  }


  // === 2. BREAK LOGIC for Live Status ===
  if (sheetName === "Live Status" && col === 3 && row > 1) {
    const name = sheet.getRange(row, 1).getValue();
    const email = sheet.getRange(row, 2).getValue();
    const status = sheet.getRange(row, 3).getValue().toLowerCase();
    const totalTodayCell = sheet.getRange(row, 4);
    const now = new Date();
    const today = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");


    const cache = CacheService.getScriptCache();
    const cacheKey = `break_${email}`;


    if (status === "break") {
      // Going on break → save time in cache
      cache.put(cacheKey, now.toString(), 21600); // 6 hours
    }


    if (status === "active") {
      const startTime = cache.get(cacheKey);
      if (startTime) {
        const start = new Date(startTime);
        const duration = Math.round((now - start) / 60000);


        // Append to Break Log sheet
        const breakSheet = e.source.getSheetByName("Break Log");
        breakSheet.appendRow([
          name,
          email,
          start,
          now,
          duration,
          today
        ]);


        // Update Total Break Today
        const prevTotal = parseFloat(totalTodayCell.getValue() || 0);
        totalTodayCell.setValue(prevTotal + duration);


        // Remove from cache
        cache.remove(cacheKey);
      }
    }
  }


  // === 3. Call Time Auto-Update on Called? = yes
  if (sheetName === "Leads" && col === 11 && row > 1) {
    const called = sheet.getRange(row, 11).getValue().toString().toLowerCase();
    const callTimeCell = sheet.getRange(row, 12);
    if (called === "yes" && !callTimeCell.getValue()) {
      callTimeCell.setValue(new Date());
    }
  }


  // === 4. Feedback Time Auto-Update ===
  if (sheetName === "Leads" && row > 1) {
    const feedbackToTimeMap = {
      "Feedback 1": "Time 1",
      "Feedback 2": "Time 2",
      "Feedback 3": "Time 3",
      "Feedback 4": "Time 4",
      "Feedback 5": "Time 5"
    };


    if (feedbackToTimeMap[editedHeader]) {
      const timeHeader = feedbackToTimeMap[editedHeader];
      const timeCol = headers.indexOf(timeHeader) + 1;
      if (timeCol > 0) {
        sheet.getRange(row, timeCol).setValue(new Date());
      }
    }
  }
}


function assignUnassignedLeadsWithTeamStatus() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads");
  const teamSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Team Status");


  // Get all team members marked as "Active"
  const teamData = teamSheet.getRange(2, 1, teamSheet.getLastRow() - 1, 3).getValues(); // Name, Email, Status
  const activeMembers = teamData.filter(row => row[2]?.toLowerCase() === "active");


  if (activeMembers.length === 0) {
    Logger.log("❌ No active team members available for assignment.");
    return;
  }


  const scriptProps = PropertiesService.getScriptProperties();
  let lastIndex = parseInt(scriptProps.getProperty("lastAssignedIndex")) || 0;


  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();


  for (let row = 1; row < data.length; row++) {
    const assignedTo = data[row][7]; // Column H
    const name = data[row][3];       // Column D


    if (!assignedTo && name) {
      const member = activeMembers[lastIndex % activeMembers.length];
      lastIndex++;
      scriptProps.setProperty("lastAssignedIndex", lastIndex.toString());


      // Assign values
      sheet.getRange(row + 1, 8).setValue(member[0]); // Assigned To
      sheet.getRange(row + 1, 9).setValue(member[1]); // Assigned Email
      sheet.getRange(row + 1, 10).setValue(new Date()); // Assigned Time


      sendAssignmentEmail(row + 1); // Instantly sends email


    }
  }
}
function markCallDelays() {
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone() || 'Asia/Kolkata';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads");
  const data = sheet.getDataRange().getValues();
  const now = new Date();

  for (let row = 1; row < data.length; row++) {
    const assignedTo = data[row][7];                    // Col H
    const assignedTime = data[row][9];                  // Col J (Date)
    const called = (data[row][10] || "").toString().toLowerCase();    // Col K
    const callDelayStatus = (data[row][12] || "").toString().toLowerCase(); // Col M

    if (!assignedTo || !assignedTime || !(assignedTime instanceof Date)) continue;

    // Skip if already decided
    if (callDelayStatus === "delayed" || callDelayStatus === "on time") continue;

    const delayCell = sheet.getRange(row + 1, 13); // Col M

    // Treat these values as on-time:
    const onTimeKeywords = ["yes", "incorrect", "not answered"];
    if (onTimeKeywords.includes(called)) {
      delayCell.setValue("On Time").setFontColor("green");
      continue;
    }

    // --- RULE A: If assigned after-hours (18:30–24:00 OR 00:00–09:30),
    // give grace until next working day 12:00 PM.
    if (isAfterHours(assignedTime, tz)) {
      const deadline = nextWorkingNoon(assignedTime, tz);
      if (now >= deadline) {
        delayCell.setValue("Delayed").setFontColor("red");
      }
      continue; // don't check 10-minute rule for after-hours leads
    }

    // --- RULE B: Assigned within working hours (09:30–18:30)
    // Apply 10-minute rule using "effective" minutes (exclude 13:00–14:00).
    const effectiveMins = effectiveMinutesSince(assignedTime, now, tz);
    if (effectiveMins >= 10) {
      delayCell.setValue("Delayed").setFontColor("red");
    }
  }
}

/** Returns true if assignedTime is outside 09:30–18:30 (local tz). */
function isAfterHours(d, tz) {
  const t = toLocal(d, tz);
  const minutes = t.getHours() * 60 + t.getMinutes();
  const start = 9 * 60 + 30;   // 09:30
  const end = 18 * 60 + 30;    // 18:30
  return (minutes < start) || (minutes >= end);
}

/** Returns a Date at next working day's 12:00 PM local time. */
function nextWorkingNoon(d, tz) {
  const t = toLocal(d, tz);
  const next = new Date(t);
  next.setDate(t.getDate() + (t.getHours() >= 18 ? 1 : (t.getHours() < 9 || (t.getHours() === 9 && t.getMinutes() < 30) ? 0 : 1)));
  // If assigned between 00:00–09:30, same day noon; if after 18:30, next day noon.
  const mins = t.getHours() * 60 + t.getMinutes();
  if (mins < (9 * 60 + 30)) {
    // same day noon
    setTimeLocal(next, 12, 0, tz);
  } else {
    // next day noon
    setTimeLocal(next, 12, 0, tz);
  }
  return toUtc(next, tz);
}

/**
 * Effective minutes between start and end, counting only:
 * - Working hours window 09:30–18:30
 * - EXCLUDING freeze window 13:00–14:00
 */
function effectiveMinutesSince(startUTC, endUTC, tz) {
  // Clip the window to [startUTC, endUTC]
  let total = 0;
  const oneDay = 24 * 60 * 60 * 1000;

  // Iterate day-by-day, but we almost always finish in same day for 10-min rule.
  let cursor = new Date(startUTC);
  while (cursor < endUTC) {
    const local = toLocal(cursor, tz);
    const dayStart = dayBoundary(local, tz); // 00:00 local for that day

    // Working window for this day
    const workStart = withTime(dayStart, 9, 30, tz);   // 09:30
    const workEnd   = withTime(dayStart, 18, 30, tz);  // 18:30

    // Freeze window 13:00–14:00
    const freezeStart = withTime(dayStart, 13, 0, tz);
    const freezeEnd   = withTime(dayStart, 14, 0, tz);

    // Overlap of [cursor, endUTC] with [workStart, workEnd], minus freeze overlap
    const dayEnd = new Date(Math.min(workEnd.getTime(), endUTC.getTime()));
    const dayStartClipped = new Date(Math.max(workStart.getTime(), startUTC.getTime()));

    let dayMins = 0;
    if (dayEnd > dayStartClipped) {
      const workOverlap = (dayEnd - dayStartClipped) / 60000;

      const freezeOverlap = overlapMinutes(
        dayStartClipped, dayEnd,
        freezeStart, freezeEnd
      );

      dayMins = Math.max(0, workOverlap - freezeOverlap);
    }

    total += dayMins;

    // Move cursor to next local day 00:00
    const nextLocalMidnight = new Date(dayStart.getTime() + oneDay);
    cursor = toUtc(nextLocalMidnight, tz);
  }

  return total;
}

// ---------- date helpers ----------
function toLocal(d, tz) {
  return new Date(Utilities.formatDate(d, tz, "yyyy/MM/dd HH:mm:ss"));
}
function toUtc(localDate, tz) {
  // Interpret localDate's displayed time in tz and convert back to UTC Date
  const y = localDate.getFullYear();
  const m = localDate.getMonth();
  const dd = localDate.getDate();
  const hh = localDate.getHours();
  const mm = localDate.getMinutes();
  const ss = localDate.getSeconds();
  const asString = Utilities.formatDate(new Date(y, m, dd, hh, mm, ss), tz, "yyyy/MM/dd HH:mm:ss");
  return new Date(asString); // Apps Script treats this as UTC-equivalent Date object
}
function dayBoundary(localDate, tz) {
  const d = new Date(localDate);
  d.setHours(0, 0, 0, 0);
  return d;
}
function withTime(localMidnight, h, m, tz) {
  const d = new Date(localMidnight);
  d.setHours(h, m, 0, 0);
  return d;
}
function setTimeLocal(localDate, h, m, tz) {
  localDate.setHours(h, m, 0, 0);
}
function overlapMinutes(aStart, aEnd, bStart, bEnd) {
  const start = Math.max(aStart.getTime(), bStart.getTime());
  const end = Math.min(aEnd.getTime(), bEnd.getTime());
  return end > start ? (end - start) / 60000 : 0;
}

// function markCallDelays() {
//   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads");
//   const data = sheet.getDataRange().getValues();
//   const now = new Date();


//   for (let row = 1; row < data.length; row++) {
//     const assignedTo = data[row][7];      // Column H
//     const assignedTime = data[row][9];    // Column J
//     const called = (data[row][10] || "").toString().toLowerCase(); // Column K
//     const callDelayStatus = (data[row][12] || "").toString().toLowerCase(); // Column M


//     if (!assignedTo || !assignedTime || !(assignedTime instanceof Date)) continue;


//     const delayCell = sheet.getRange(row + 1, 13); // Column M
//     const diffMins = (now - assignedTime) / 60000;


//     // Skip if already marked
//     if (callDelayStatus === "delayed" || callDelayStatus === "on time") continue;


//     // Treat these values as on-time:
//     const onTimeKeywords = ["yes", "incorrect", "not answered"];


//     if (onTimeKeywords.includes(called)) {
//       delayCell.setValue("On Time").setFontColor("green");
//     } else if (diffMins >= 10) {
//       delayCell.setValue("Delayed").setFontColor("red");
//     }
//   }
// }


function logBreak() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const liveSheet = ss.getSheetByName("Live Status");
  const breakSheet = ss.getSheetByName("Break Log");


  const liveData = liveSheet.getDataRange().getValues();
  const now = new Date();
  const today = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");


  for (let i = 1; i < liveData.length; i++) {
    const name = liveData[i][0];
    const email = liveData[i][1];
    const status = liveData[i][2];
    const totalToday = parseFloat(liveData[i][3] || 0);


    const cache = CacheService.getScriptCache();
    const cacheKey = `break_${email}`;
    const startTime = cache.get(cacheKey);


    // If the person is now ACTIVE and was on BREAK earlier
    if (status.toLowerCase() === "active" && startTime) {
      const start = new Date(startTime);
      const duration = Math.round((now - start) / 60000); // in minutes


      // Log to Break Log
      breakSheet.appendRow([
        name,
        email,
        start,
        now,
        duration,
        today
      ]);


      // Update Total Break Today in Live Status
      liveSheet.getRange(i + 1, 4).setValue(totalToday + duration); // Column D


      // Clear cache
      cache.remove(cacheKey);
    }


    // If the person just went to break, store the start time
    if (status.toLowerCase() === "break" && !startTime) {
      cache.put(cacheKey, now.toString(), 21600); // store for 6 hours
    }
  }
}


function updatePerformanceTracker() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leadSheet = ss.getSheetByName("Leads");          // Auto Leads
  const manualSheet = ss.getSheetByName("Manual Leads"); // Manual Leads
  const perfSheet = ss.getSheetByName("Performance Tracker");
  const liveSheet = ss.getSheetByName("Live Status");

  const leads = leadSheet.getDataRange().getValues();
  const manualLeads = manualSheet.getDataRange().getValues();
  const live = liveSheet.getDataRange().getValues();
  const users = perfSheet.getRange(2, 1, perfSheet.getLastRow() - 1).getValues().map(row => row[0]); // Names

  // === Build email → name map from Auto Leads ===
  const headers = leads[0];
  const rows = leads.slice(1);
  const assignedToCol = headers.indexOf("Assigned To");
  const assignedEmailCol = headers.indexOf("Assigned Email");
  const siteCol = headers.indexOf("Site Visit?");
  const bookedCol = headers.indexOf("Booked?");
  const delayCol = headers.indexOf("Call Delay?");

  const emailToName = {};
  rows.forEach(row => {
    const name = (row[assignedToCol] || "").trim();
    const email = (row[assignedEmailCol] || "").toString().trim().toLowerCase();
    if (name && email) emailToName[email] = name;
  });

  // === Initialize tracking object keyed by name ===
  const performance = {};
  users.forEach(name => {
    performance[name] = {
      totalLeads: 0,
      delays: 0,
      siteVisits: 0,
      bookings: 0,
      breakMinutes: 0,
      score: 0
    };
  });

  // === Process Auto Leads (map email → name) ===
  rows.forEach(row => {
    const email = (row[assignedEmailCol] || "").toString().trim().toLowerCase();
    const name = emailToName[email];
    if (name && performance[name] !== undefined) {
      performance[name].totalLeads++;
      if (/^delayed$/i.test(row[delayCol] || "")) performance[name].delays++;
      if (/^yes$/i.test(row[siteCol] || "")) performance[name].siteVisits++;
      if (/^yes$/i.test(row[bookedCol] || "")) performance[name].bookings++;
    }
  });

  // === Process Manual Leads (Assignee is Email → map to Name) ===
  const mHeaders = manualLeads[0];
  const mRows = manualLeads.slice(1);
  const mAssigneeCol = mHeaders.indexOf("Assignee");
  const mSiteCol = mHeaders.indexOf("Site Visit?");
  const mBookedCol = mHeaders.indexOf("Booked?");

  mRows.forEach(row => {
    const email = (row[mAssigneeCol] || "").toString().trim().toLowerCase();
    const name = emailToName[email];
    if (name && performance[name] !== undefined) {
      performance[name].totalLeads++;
      if (/^yes$/i.test(row[mSiteCol] || "")) performance[name].siteVisits++;
      if (/^yes$/i.test(row[mBookedCol] || "")) performance[name].bookings++;
    }
  });

  // === Pull break data from Live Status (Email → Name) ===
  for (let j = 1; j < live.length; j++) {
    const email = (live[j][1] || "").toString().trim().toLowerCase(); // assume col B = Email
    const breakMin = parseFloat(live[j][3] || 0);
    const name = emailToName[email];
    if (name && performance[name] !== undefined) {
      performance[name].breakMinutes = breakMin;
    }
  }

  // === Write everything to Performance Tracker (by Name) ===
  for (let i = 0; i < users.length; i++) {
    const name = users[i];
    const perf = performance[name];
    const row = i + 2; // Because header is row 1

    const score = (perf.bookings * 2) + (perf.siteVisits * 1) - (perf.delays * 0.25) - (perf.breakMinutes * 0.01);

    perfSheet.getRange(row, 2).setValue(perf.totalLeads);
    perfSheet.getRange(row, 3).setValue(perf.delays);
    perfSheet.getRange(row, 4).setValue(perf.delays); // Duplicate column in your sheet
    perfSheet.getRange(row, 5).setValue(perf.siteVisits);
    perfSheet.getRange(row, 6).setValue(perf.bookings);
    perfSheet.getRange(row, 7).setValue(perf.breakMinutes);
    perfSheet.getRange(row, 8).setValue(score.toFixed(2));
  }
}


function sendAssignmentEmail(row) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads");
  if (!sheet || !row || isNaN(row)) {
    Logger.log("❌ Invalid row passed to sendAssignmentEmail: " + row);
    return;
  }


  const data = sheet.getRange(row, 1, 1, 15).getValues()[0];


  const leadId = data[0];
  const project = data[1];
  const source = data[2];
  const name = data[3];
  const email = data[4];
  const phone = data[5];
  const city = data[6];
  const assignedTo = data[7];
  const assignedEmail = data[8];


  if (!assignedEmail) {
    Logger.log(`⚠️ No assigned email for lead in row ${row}`);
    return;
  }


  const subject = `🔔 New Lead Assigned: ${leadId}`;
  const body = `
Hi ${assignedTo},


A new lead has been assigned to you:


🧾 Lead ID: ${leadId}  
👤 Name: ${name}  
📞 Phone: ${phone}  
📧 Email: ${email}  
🏠 Project: ${project}  
🌐 Source: ${source}  
📍 City: ${city}


Please follow up within 10 minutes for best performance.


Regards,  
Titans
`;


  GmailApp.sendEmail(assignedEmail, subject, body);
}


function doGet(e) {
  try {
    // Handle CORS preflight
    if (e.parameter.cors === 'true') {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '3600'
        });
    }
    
    // Handle lead updates
    if (e.parameter.updateLead) {
      return handleLeadUpdate(e.parameter);
    }
    
    const action = e.parameter.action || "getLeads";


    const actionsThatDontNeedEmail = [
    "addManualLead",
    "updateLead",
    "getTeamStatus",
    "updateTeamStatus",
    "getAdminStats",
    "updateManualLead",
    "getLeaderboard",
    "getDailyTip",
    "getProjectInfo"  // ✅ Add this line
    ];

    if (!e.parameter.email && !actionsThatDontNeedEmail.includes(action)) {
      throw new Error("Missing email parameter");
    }


    const email = (e.parameter.email || "").toLowerCase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();


    // 🚀 Leads API
    if (action === "getLeads") {
      const sheet = ss.getSheetByName("Leads");
      const data = sheet.getDataRange().getValues();
      const headers = data[0].map(h => h.toString().trim());
      const rows = data.slice(1);

      // Create a map of normalized header names to column indices
      const headerMap = {};
      headers.forEach((header, index) => {
        if (header) {
          const normalizedHeader = header
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
          headerMap[normalizedHeader] = index;
        }
      });

      // Helper function to get column index by possible header names
      const getColIndex = (possibleHeaders) => {
        for (const header of possibleHeaders) {
          const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (headerMap[normalized] !== undefined) {
            return headerMap[normalized];
          }
        }
        return -1;
      };

      // Find the assigned email column (try multiple variations)
      const assignedEmailCol = getColIndex(["Assigned Email", "AssignedEmail", "Email"]);
      if (assignedEmailCol === -1) {
        console.error("Could not find 'Assigned Email' column in sheet");
        return ContentService.createTextOutput(JSON.stringify({ error: "Could not find 'Assigned Email' column in sheet" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // Filter rows by email (case-insensitive)
      const filtered = rows.filter(row => {
        const rowEmail = (row[assignedEmailCol] || "").toString().toLowerCase().trim();
        return rowEmail === email.toLowerCase().trim();
      });

      // Map rows to objects with consistent field names
      const result = filtered.map(row => {
        const obj = {};
        
        // Map all columns with their original headers
        headers.forEach((h, i) => {
          obj[h] = row[i];
        });
        
        // Ensure all expected fields exist with proper casing
        const fieldMappings = [
          { target: 'Called?', sources: ['Called?', 'Called', 'Status'] },
          { target: 'Site Visit?', sources: ['Site Visit?', 'SiteVisit', 'Site Visit'] },
          { target: 'Booked?', sources: ['Booked?', 'Booked', 'Status'] },
          { target: 'Lead Quality', sources: ['Lead Quality', 'Quality', 'LeadQuality'] },
          { target: 'Lead ID', sources: ['Lead ID', 'ID', 'LeadID'] },
          { target: 'Phone', sources: ['Phone', 'Phone Number', 'PhoneNumber', 'Mobile'] },
          { target: 'Project', sources: ['Project', 'Project Name', 'ProjectName'] },
          { target: 'Name', sources: ['Name', 'Customer Name', 'CustomerName'] },
          { target: 'Assigned To', sources: ['Assigned To', 'AssignedTo', 'Assignee'] },
          { target: 'Assigned Email', sources: ['Assigned Email', 'AssignedEmail', 'Email'] }
        ];
        
        // Add feedback fields
        for (let i = 1; i <= 5; i++) {
          fieldMappings.push({
            target: `Feedback ${i}`,
            sources: [`Feedback ${i}`, `Feedback${i}`, `FB${i}`, `Comment ${i}`, `Comment${i}`]
          });
        }
        
        // Apply field mappings
        fieldMappings.forEach(mapping => {
          const colIndex = getColIndex(mapping.sources);
          if (colIndex >= 0 && row[colIndex] !== undefined && row[colIndex] !== '') {
            obj[mapping.target] = row[colIndex];
          } else if (!obj[mapping.target]) {
            obj[mapping.target] = ''; // Ensure field exists even if empty
          }
        });
        
        return obj;
      });

      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }


    // ✅ Team Status
    if (action === "getTeamStatus") {
      const sheet = ss.getSheetByName("Team Status");
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);


      const result = rows.map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
      });


      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }


    if (action === "updateTeamStatus") {
      const sheet = ss.getSheetByName("Team Status");
      const updateEmail = (e.parameter.email || "").toLowerCase();
      const newStatus = e.parameter.status;


      const data = sheet.getDataRange().getValues();
      const rowIndex = data.findIndex((row, i) => i > 0 && (row[1] || "").toLowerCase() === updateEmail);


      if (rowIndex === -1) throw new Error("Email not found in Team Status");


      sheet.getRange(rowIndex + 1, 3).setValue(newStatus);


      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }


    // ⏱️ Break/Status API
    if (action === "getStatus" || action === "updateStatus") {
      const sheet = ss.getSheetByName("Live Status");
      const data = sheet.getDataRange().getValues();
      const rowIndex = data.findIndex((row, index) => index > 0 && row[1].toLowerCase() === email);
      if (rowIndex === -1) throw new Error("User not found in Live Status");


      const row = rowIndex + 1;


      if (action === "getStatus") {
        const status = sheet.getRange(row, 3).getValue();
        const breakMinutes = sheet.getRange(row, 4).getValue() || 0;
        return ContentService.createTextOutput(JSON.stringify({ status, breakMinutes })).setMimeType(ContentService.MimeType.JSON);
      }


      if (action === "updateStatus") {
        const statusRaw = (e.parameter.status || "").toLowerCase();
        const newStatus = statusRaw === "break" ? "Break" : "Active";


        const statusCell = sheet.getRange(row, 3);
        const breakStartCell = sheet.getRange(row, 5);
        const now = new Date();


        if (newStatus === "Break") {
          breakStartCell.setValue(now);
        }


        if (newStatus === "Active") {
          const start = breakStartCell.getValue();
          if (start instanceof Date) {
            const minutes = Math.floor((now - new Date(start)) / 60000);
            const totalBreakCell = sheet.getRange(row, 4);
            const existing = totalBreakCell.getValue() || 0;
            totalBreakCell.setValue(existing + minutes);
          }
          breakStartCell.setValue("");
        }


        statusCell.setValue(newStatus);
        return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
      }
    }


    // 📊 Performance API
    if (action === "getPerformance") {
      const leadsSheet = ss.getSheetByName("Leads");
      const statusSheet = ss.getSheetByName("Live Status");


      const leadsData = leadsSheet.getDataRange().getValues();
      const leadsHeaders = leadsData[0];
      const leadsRows = leadsData.slice(1);


      const assignedEmailCol = leadsHeaders.indexOf("Assigned Email");
      const calledCol = leadsHeaders.indexOf("Called?");
      const siteCol = leadsHeaders.indexOf("Site Visit?");
      const bookedCol = leadsHeaders.indexOf("Booked?");
      const delayCol = leadsHeaders.indexOf("Call Delay?");


      const userLeads = leadsRows.filter(row => (row[assignedEmailCol] || "").toLowerCase() === email);


      let totalCalls = 0, delays = 0, siteVisits = 0, bookings = 0;


      userLeads.forEach(row => {
        if (row[calledCol] === "Yes") totalCalls++;
        if (row[delayCol] === "Delayed") delays++;
        if (row[siteCol] === "Yes") siteVisits++;
        if (row[bookedCol] === "Yes") bookings++;
      });


      const statusData = statusSheet.getDataRange().getValues();
      const statusRow = statusData.find(r => r[1].toLowerCase() === email);
      const breakMinutes = statusRow ? statusRow[3] || 0 : 0;


      const score = siteVisits * 2 + bookings * 5 - delays * 0.25 - breakMinutes * 0.01;


      return ContentService.createTextOutput(JSON.stringify({
        totalCalls,
        delays,
        siteVisits,
        bookings,
        breakMinutes,
        score: Math.round(score * 10) / 10
      })).setMimeType(ContentService.MimeType.JSON);
    }


    // 📋 Manual Leads - Fetch
    if (action === "getManualLeads") {
      const sheet = ss.getSheetByName("Manual Leads");
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);


      const result = rows
        .filter(row => row.length > 1 && row[headers.indexOf("Assignee")].toLowerCase() === email)
        .map(row => {
          const obj = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;
        });


      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }


    // 📋 Manual Leads - Add
    if (action === "addManualLead") {
      const sheet = ss.getSheetByName("Manual Leads");

      const leadId = e.parameter.leadId || "ML" + new Date().getTime().toString().slice(-6);
      const project = e.parameter.project || "";
      const name = e.parameter.name || "";
      const phone = e.parameter.phone || "";
      const lookingFor = e.parameter.lookingFor || "";
      const assignee = e.parameter.email || "";
      const siteVisit = e.parameter.siteVisit || "No";
      const siteVisitDate = e.parameter.siteVisitDate || "";
      const booked = e.parameter.booked || "";
      const feedback1 = e.parameter.feedback1 || "";
      const feedback2 = e.parameter.feedback2 || "";
      const feedback3 = e.parameter.feedback3 || "";
      const feedback4 = e.parameter.feedback4 || "";
      const feedback5 = e.parameter.feedback5 || "";
      const leadQuality = e.parameter.leadQuality || "WIP";

      // Get headers to find column indices
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const headerMap = {};
      headers.forEach((header, index) => {
        headerMap[header.trim()] = index + 1; // +1 because getRange is 1-based
      });

      // Create a new row with empty values
      const newRow = new Array(headers.length).fill("");
      
      // Helper function to find the best matching header
      const getHeaderIndex = (possibleHeaders) => {
        for (const header of possibleHeaders) {
          if (headerMap[header] !== undefined) {
            return headerMap[header] - 1; // Convert to 0-based index
          }
        }
        return -1;
      };

      // Map the values to the correct columns with flexible header matching
      const leadIdIndex = getHeaderIndex(["Lead ID", "LeadID", "ID"]);
      if (leadIdIndex !== -1) newRow[leadIdIndex] = leadId;
      
      const projectIndex = getHeaderIndex(["Project", "Project Name", "ProjectName"]);
      if (projectIndex !== -1) newRow[projectIndex] = project;
      
      const nameIndex = getHeaderIndex(["Name", "Customer Name", "CustomerName", "Client Name", "ClientName"]);
      if (nameIndex !== -1) newRow[nameIndex] = name;
      
      // Handle phone number with multiple possible header names
      const phoneIndex = getHeaderIndex(["Phone", "Phone Number", "PhoneNumber", "Mobile", "Contact Number"]);
      if (phoneIndex !== -1) newRow[phoneIndex] = phone;
      
      // Handle "Looking For" field with multiple possible header names
      const lookingForIndex = getHeaderIndex(["Looking For", "LookingFor", "Looking For?", "Requirement", "Interested In", "InterestedIn"]);
      if (lookingForIndex !== -1) {
        newRow[lookingForIndex] = lookingFor;
        Logger.log(`Looking For field found at index ${lookingForIndex} with value: ${lookingFor}`);
      } else {
        Logger.log(`Looking For column not found. Available headers: ${headers.join(', ')}`);
      }
      if (headerMap["Assignee"]) newRow[headerMap["Assignee"] - 1] = assignee;
      // Handle Site Visit and Site Visit Date
      const siteVisitCol = getHeaderIndex(["Site Visit", "SiteVisit", "Site Visit?"]);
      if (siteVisitCol !== -1) {
        newRow[siteVisitCol] = siteVisit;
      }
      
      // Handle Site Visit Date
      const siteVisitDateCol = getHeaderIndex(["Site Visit Date", "SiteVisitDate", "Visit Date", "SiteVisit Date"]);
      if (siteVisitDateCol !== -1 && siteVisit === "Yes" && siteVisitDate) {
        try {
          // Try to parse and format the date
          const date = new Date(siteVisitDate);
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD for consistency
            const formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
            newRow[siteVisitDateCol] = formattedDate;
          } else {
            newRow[siteVisitDateCol] = siteVisitDate; // Fallback to raw value
          }
        } catch (e) {
          console.error("Error formatting date:", e);
          newRow[siteVisitDateCol] = siteVisitDate; // Fallback to raw value
        }
      }
      if (headerMap["Booked"] || headerMap["Booked?"] || headerMap["Status"]) {
        const bookedCol = headerMap["Booked"] || headerMap["Booked?"] || headerMap["Status"];
        newRow[bookedCol - 1] = booked;
      }
      if (headerMap["Feedback 1"] || headerMap["Feedback1"]) {
        const feedback1Col = headerMap["Feedback 1"] || headerMap["Feedback1"];
        newRow[feedback1Col - 1] = feedback1;
      }
      if (headerMap["Feedback 2"] || headerMap["Feedback2"]) {
        const feedback2Col = headerMap["Feedback 2"] || headerMap["Feedback2"];
        newRow[feedback2Col - 1] = feedback2;
      }
      if (headerMap["Feedback 3"] || headerMap["Feedback3"]) {
        const feedback3Col = headerMap["Feedback 3"] || headerMap["Feedback3"];
        newRow[feedback3Col - 1] = feedback3;
      }
      if (headerMap["Feedback 4"] || headerMap["Feedback4"]) {
        const feedback4Col = headerMap["Feedback 4"] || headerMap["Feedback4"];
        newRow[feedback4Col - 1] = feedback4;
      }
      if (headerMap["Feedback 5"] || headerMap["Feedback5"]) {
        const feedback5Col = headerMap["Feedback 5"] || headerMap["Feedback5"];
        newRow[feedback5Col - 1] = feedback5;
      }
      if (headerMap["Lead Quality"] || headerMap["LeadQuality"] || headerMap["Quality"]) {
        const qualityCol = headerMap["Lead Quality"] || headerMap["LeadQuality"] || headerMap["Quality"];
        newRow[qualityCol - 1] = leadQuality;
      }
      if (headerMap["Date"] || headerMap["Created At"]) {
        const dateCol = headerMap["Date"] || headerMap["Created At"];
        newRow[dateCol - 1] = new Date();
      }

      // Add the new row
      sheet.appendRow(newRow);

      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 📋 Manual Leads - Get
    if (action === "getManualLeads") {
      const sheet = ss.getSheetByName("Manual Leads");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ 
          error: 'Manual Leads sheet not found' 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
      }
      
      const headers = data[0].map(header => header.toString().trim());
      const email = e.parameter.email;
      const isAdmin = email === "admin@example.com"; // Replace with your admin email check
      
      // Map the data to objects with proper headers
      const leads = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length === 0) continue; // Skip empty rows
        
        const lead = {};
        headers.forEach((header, index) => {
          // Only include the field if it has a header and the value exists
          if (header && row[index] !== undefined) {
            lead[header] = row[index];
          }
        });
        
        // Only include leads assigned to the current user or all leads for admin
        if (isAdmin || lead["Assignee"] === email) {
          leads.push(lead);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify(leads))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 📋 Manual Leads - Update
    if (action === "updateManualLead") {
      const sheet = ss.getSheetByName("Manual Leads");
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const leadId = e.parameter.leadId;
      const updates = JSON.parse(e.parameter.updates || '{}');
      
      // Find the row with the matching lead ID
      let rowIndex = -1;
      const idColumnIndex = headers.findIndex(header => 
        header.toString().toLowerCase() === 'lead id' || 
        header.toString().toLowerCase() === 'leadid' ||
        header.toString().toLowerCase() === 'id'
      );
      
      if (idColumnIndex === -1) {
        return ContentService.createTextOutput(JSON.stringify({ 
          error: 'Could not find Lead ID column in the sheet' 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Find the row with the matching lead ID (skip header row)
      for (let i = 1; i < data.length; i++) {
        if (data[i][idColumnIndex] === leadId) {
          rowIndex = i + 1; // +1 because getRange is 1-based
          break;
        }
      }
      
      if (rowIndex === -1) {
        return ContentService.createTextOutput(JSON.stringify({ 
          error: 'Lead ID not found' 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Create a map of normalized header names to their column indices
      const headerMap = {};
      headers.forEach((header, index) => {
        if (header) {
          // Normalize header name by removing spaces, special chars, and converting to lowercase
          const normalizedHeader = header.toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
          headerMap[normalizedHeader] = index;
        }
      });
      
      // Update each field in the updates object
      Object.entries(updates).forEach(([field, value]) => {
        // Normalize the field name to match the header format
        const normalizedField = field
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
          
        // Special handling for feedback fields (Feedback1, Feedback2, etc.)
        const feedbackMatch = normalizedField.match(/^feedback(\d+)$/);
        if (feedbackMatch) {
          const feedbackNum = feedbackMatch[1];
          // Try both "Feedback X" and "FeedbackX" formats
          const possibleHeaders = [
            `feedback${feedbackNum}`,
            `feedback ${feedbackNum}`
          ];
          
          for (const header of possibleHeaders) {
            const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (headerMap[normalizedHeader] !== undefined) {
              sheet.getRange(rowIndex, headerMap[normalizedHeader] + 1).setValue(value);
              break;
            }
          }
          return;
        }
        
        // Special handling for site visit date
        if (normalizedField.includes('sitevisitdate') || normalizedField.includes('sitevisit')) {
          const possibleHeaders = ['Site Visit Date', 'SiteVisitDate', 'Site Visit', 'SiteVisit'];
          for (const header of possibleHeaders) {
            const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (headerMap[normalizedHeader] !== undefined) {
              sheet.getRange(rowIndex, headerMap[normalizedHeader] + 1).setValue(value);
              break;
            }
          }
          return;
        }
        
        // Handle other fields
        if (headerMap[normalizedField] !== undefined) {
          sheet.getRange(rowIndex, headerMap[normalizedField] + 1).setValue(value);
        } else {
          console.warn(`Column not found for field: ${field}`);
        }
      });
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true 
      })).setMimeType(ContentService.MimeType.JSON);
    }


    // ✅ Auto Leads - Update with Feedback Time Logic
    if (action === "updateLead") {
      try {
        const sheet = ss.getSheetByName("Leads");
        const data = sheet.getDataRange().getValues();
        const headers = data[0].map(h => h.toString().trim());
        const rows = data.slice(1);

        // Create a map of normalized header names to column indices
        const headerMap = {};
        headers.forEach((header, index) => {
          if (header) {
            const normalizedHeader = header
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '');
            headerMap[normalizedHeader] = index;
          }
        });

        // Helper function to find column index by possible header names
        const getColIndex = (possibleHeaders) => {
          for (const header of possibleHeaders) {
            const normalized = header.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (headerMap[normalized] !== undefined) {
              return headerMap[normalized];
            }
          }
          return -1;
        };

        // Find the lead by ID (checking multiple possible ID columns)
        const leadId = e.parameter.leadId;
        let rowIndex = -1;
        
        // Try multiple possible ID column names
        const idColumns = [
          'Lead ID', 'ID', 'LeadID', 'LeadId', 'leadid', 'lead_id', 'lead id'
        ];
        
        for (const idCol of idColumns) {
          const colIndex = getColIndex([idCol]);
          if (colIndex >= 0) {
            rowIndex = rows.findIndex(row => 
              row[colIndex] && row[colIndex].toString() === leadId.toString()
            );
            if (rowIndex !== -1) break;
          }
        }
        
        // If still not found, try the first column as fallback
        if (rowIndex === -1) {
          rowIndex = rows.findIndex(row => 
            row[0] && row[0].toString() === leadId.toString()
          );
        }
        
        if (rowIndex === -1) {
          console.error(`Lead ID ${leadId} not found in sheet`);
          return ContentService.createTextOutput(JSON.stringify({ 
            error: `Lead ID ${leadId} not found in sheet` 
          })).setMimeType(ContentService.MimeType.JSON);
        }

        const rowNum = rowIndex + 2; // +2 because data is 0-based and we have a header row
        const now = new Date();
        let updatesMade = false;

        // Field mapping configuration
        const fieldMappings = [
          { param: 'called', possibleHeaders: ['Called?', 'Called', 'Status'] },
          { param: 'siteVisit', possibleHeaders: ['Site Visit?', 'SiteVisit', 'Site Visit', 'SiteVisit'] },
          { param: 'booked', possibleHeaders: ['Booked?', 'Booked', 'Status'] },
          { param: 'quality', possibleHeaders: ['Lead Quality', 'Quality', 'LeadQuality'] },
          { param: 'leadQuality', possibleHeaders: ['Lead Quality', 'Quality', 'LeadQuality'] },
          { param: 'status', possibleHeaders: ['Status', 'Lead Status', 'LeadStatus'] },
          { param: 'notes', possibleHeaders: ['Notes', 'Remarks', 'Comments'] }
        ];

        // Process each field update
        for (const field of fieldMappings) {
          const value = e.parameter[field.param];
          if (value !== undefined && value !== null && value !== '') {
            const colIndex = getColIndex(field.possibleHeaders);
            if (colIndex >= 0) {
              sheet.getRange(rowNum, colIndex + 1).setValue(value);
              updatesMade = true;
              console.log(`Updated ${field.param} to ${value} in column ${headers[colIndex]}`);
            } else {
              console.warn(`Column not found for ${field.param}, tried: ${field.possibleHeaders.join(', ')}`);
            }
          }
        }

        // Update feedback fields
        for (let i = 1; i <= 5; i++) {
          const feedbackValue = e.parameter[`feedback${i}`];
          if (feedbackValue !== undefined && feedbackValue !== '') {
            // Try multiple possible feedback column names
            const feedbackCol = getColIndex([
              `Feedback ${i}`, `Feedback${i}`, `FB${i}`, `Comment ${i}`, `Comment${i}`,
              `Feedback ${i} Notes`, `Feedback${i}Notes`, `Note ${i}`, `Note${i}`
            ]);
            
            if (feedbackCol >= 0) {
              sheet.getRange(rowNum, feedbackCol + 1).setValue(feedbackValue);
              updatesMade = true;
              console.log(`Updated Feedback ${i} to: ${feedbackValue}`);
              
              // Update the corresponding time field if it exists
              const timeCol = getColIndex([
                `Time ${i}`, `Time${i}`, `Feedback ${i} Time`, `Feedback${i}Time`,
                `Updated ${i}`, `Updated${i}`, `Timestamp ${i}`, `Timestamp${i}`
              ]);
              
              if (timeCol >= 0) {
                sheet.getRange(rowNum, timeCol + 1).setValue(now);
                console.log(`Updated Time ${i} to: ${now}`);
              }
            } else {
              console.warn(`Feedback ${i} column not found`);
            }
          }
        }

        // Force sheet update if changes were made
        if (updatesMade) {
          SpreadsheetApp.flush();
          console.log(`Successfully updated lead ${leadId}`);
          return ContentService.createTextOutput(JSON.stringify({ 
            success: true,
            message: `Successfully updated lead ${leadId}`
          })).setMimeType(ContentService.MimeType.JSON);
        } else {
          console.warn(`No updates were made to lead ${leadId}`);
          return ContentService.createTextOutput(JSON.stringify({ 
            success: false,
            message: 'No updates were made - no valid fields to update'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      } catch (error) {
        console.error('Error in updateLead:', error);
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: error.message || 'Unknown error occurred',
          stack: error.stack
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }




     // 📊 Admin Dashboard Analytics
if (action === "getAdminStats") {
  const project = e.parameter.project || "";
  const member = e.parameter.member || "";
  const dateRange = e.parameter.dateRange || "";

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Leads");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const leads = data.slice(1);
  const idx = (col) => headers.indexOf(col);

  // === Get Manual Leads
  const manualSheet = ss.getSheetByName("Manual Leads");
  const manualData = manualSheet.getDataRange().getValues();
  const manualHeaders = manualData[0];
  const manualRows = manualData.slice(1);
  const manualIdx = (col) => manualHeaders.indexOf(col);

  // === Date filter setup
  const now = new Date();
  let fromDate = new Date("2000-01-01");

  if (dateRange === "7d") fromDate.setDate(now.getDate() - 7);
  else if (dateRange === "30d") fromDate.setDate(now.getDate() - 30);
  else if (dateRange === "thisMonth") fromDate = new Date(now.getFullYear(), now.getMonth(), 1);

  // === Filter Auto Leads
  const filteredAuto = leads.filter(row => {
    const timeStr = row[idx("Assigned Time")];
    if (!timeStr) return false;
    const assignedTime = new Date(timeStr);
    if (isNaN(assignedTime)) return false;

    const projMatch = !project || row[idx("Project")] === project;
    const memberMatch = !member || row[idx("Assigned To")] === member;
    const dateMatch = assignedTime >= fromDate;
    return projMatch && memberMatch && dateMatch;
  });

  // === Filter Manual Leads with date check
  const filteredManual = manualRows.filter(row => {
    const projMatch = !project || row[manualIdx("Project")] === project;
    const memberMatch = !member || row[manualIdx("Assignee")] === member;

    // Try "Date" or "Created At" columns
    let dateMatch = true;
    if (dateRange) {
      let dateStr = row[manualIdx("Date")] || row[manualIdx("Created At")];
      if (dateStr) {
        const createdDate = new Date(dateStr);
        dateMatch = createdDate >= fromDate && !isNaN(createdDate);
      } else {
        dateMatch = false; // No date = exclude if filtering
      }
    }

    return projMatch && memberMatch && dateMatch;
  });

  // === Normalize quality
  const normalizeQuality = (quality) => {
    if (!quality) return null;
    const q = quality.toString().trim().toLowerCase();
    if (q === 'wip') return 'WIP';
    if (q === 'warm') return 'Warm';
    if (q === 'cold') return 'Cold';
    if (q === 'rnr' || q === 'ring no reply' || q === 'ring no response') return 'RNR';
    if (q === 'invalid') return 'Invalid';
    if (q === 'junk') return 'Junk';
    return null;
  };

  const isYes = (val) => (val || "").toString().trim().toLowerCase() === "yes";

  const teamMap = {};
  const qualityMap = { WIP: 0, Warm: 0, Cold: 0, RNR: 0, Invalid: 0, Junk: 0 };
  const teamQualityMap = {};
  const emailToName = {};

  // === Process Auto Leads
  filteredAuto.forEach(row => {
    const email = (row[idx("Assigned Email")] || "").toString().trim().toLowerCase();
    const name = (row[idx("Assigned To")] || "").toString().trim();
    if (email && name) emailToName[email] = name;

    const key = email || name;
    if (!teamMap[key]) teamMap[key] = { name: name || email, email, leads: 0, called: 0, siteVisits: 0, bookings: 0, callDelay: 0, autoLeads: 0, manualLeads: 0 };

    teamMap[key].leads++;
    teamMap[key].autoLeads++;
    if (isYes(row[idx("Called?")])) teamMap[key].called++;
    if (isYes(row[idx("Site Visit?")])) teamMap[key].siteVisits++;
    if (isYes(row[idx("Booked?")])) teamMap[key].bookings++;
    if (isYes(row[idx("Call Delay?")])) teamMap[key].callDelay++;

    const normalizedQuality = normalizeQuality(row[idx("Lead Quality")]);
    if (normalizedQuality) {
      qualityMap[normalizedQuality] = (qualityMap[normalizedQuality] || 0) + 1;
      if (!teamQualityMap[key]) teamQualityMap[key] = {};
      const qKey = `auto${normalizedQuality}`;
      teamQualityMap[key][qKey] = (teamQualityMap[key][qKey] || 0) + 1;
    }
  });

  // === Process Manual Leads
  filteredManual.forEach(row => {
    const email = (row[manualIdx("Assignee Email")] || "").toString().trim().toLowerCase();
    const name = emailToName[email] || (row[manualIdx("Assignee")] || "").toString().trim();
    const key = email || name;

    if (!teamMap[key]) teamMap[key] = { name, email, leads: 0, called: 0, siteVisits: 0, bookings: 0, callDelay: 0, autoLeads: 0, manualLeads: 0 };

    teamMap[key].leads++;
    teamMap[key].manualLeads++;
    if (isYes(row[manualIdx("Site Visit?")])) teamMap[key].siteVisits++;
    if (isYes(row[manualIdx("Booked?")])) teamMap[key].bookings++;

    const normalizedQuality = normalizeQuality(row[manualIdx("Lead Quality")]);
    if (normalizedQuality) {
      qualityMap[normalizedQuality] = (qualityMap[normalizedQuality] || 0) + 1;
      if (!teamQualityMap[key]) teamQualityMap[key] = {};
      const qKey = `manual${normalizedQuality}`;
      teamQualityMap[key][qKey] = (teamQualityMap[key][qKey] || 0) + 1;
    }
  });

  // === Build Leaderboard
  const teamStats = Object.values(teamMap).map(stat => {
    const q = teamQualityMap[stat.email || stat.name] || {};
    return {
      ...stat,
      autoWIP: q.autoWIP || 0,
      autoWarm: q.autoWarm || 0,
      autoCold: q.autoCold || 0,
      autoRNR: q.autoRNR || 0,
      autoInvalid: q.autoInvalid || 0,
      autoJunk: q.autoJunk || 0,
      manualWIP: q.manualWIP || 0,
      manualWarm: q.manualWarm || 0,
      manualCold: q.manualCold || 0,
      manualRNR: q.manualRNR || 0,
      manualInvalid: q.manualInvalid || 0,
      manualJunk: q.manualJunk || 0,
      totalWIP: (q.autoWIP || 0) + (q.manualWIP || 0),
      totalWarm: (q.autoWarm || 0) + (q.manualWarm || 0),
      totalCold: (q.autoCold || 0) + (q.manualCold || 0),
      totalRNR: (q.autoRNR || 0) + (q.manualRNR || 0),
      totalInvalid: (q.autoInvalid || 0) + (q.manualInvalid || 0),
      totalJunk: (q.autoJunk || 0) + (q.manualJunk || 0),
      score: (stat.bookings * 5) + (stat.siteVisits * 2) 
    };
  });

  const autoLeadsCount = filteredAuto.length;
  const manualLeadsCount = filteredManual.length;
  const totalLeadsCount = autoLeadsCount + manualLeadsCount;

  const totalBookings =
    filteredAuto.filter(r => isYes(r[idx("Booked?")])).length +
    filteredManual.filter(r => isYes(r[manualIdx("Booked?")])).length;

  const totalSiteVisits =
    filteredAuto.filter(r => isYes(r[idx("Site Visit?")])).length +
    filteredManual.filter(r => isYes(r[manualIdx("Site Visit?")])).length;

  const junkCount = qualityMap["Junk"] || 0;
  const effectiveLeads = totalLeadsCount - junkCount;
  const conversionPercent = effectiveLeads > 0
    ? ((totalBookings / effectiveLeads) * 100).toFixed(1)
    : "0.0";

  return ContentService.createTextOutput(JSON.stringify({
    teamStats,
    autoLeadsCount,
    manualLeadsCount,
    totalLeadsCount,
    siteVisitsCount: totalSiteVisits,
    bookingsCount: totalBookings,
    conversionPercent,
    qualityDistribution: Object.keys(qualityMap).map(type => ({ name: type, value: qualityMap[type] }))
  })).setMimeType(ContentService.MimeType.JSON);
}



if (action === "updateManualLead") {
  const sheet = ss.getSheetByName("Manual Leads");
  const leadId = e.parameter.leadId;
  const field = e.parameter.field;
  const value = e.parameter.value;


  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rowIndex = data.findIndex((row, i) => i > 0 && row[0] === leadId);
  if (rowIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Lead not found" })).setMimeType(ContentService.MimeType.JSON);
  }


  const colIndex = headers.indexOf(field);
  if (colIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Field not found" })).setMimeType(ContentService.MimeType.JSON);
  }


  sheet.getRange(rowIndex + 1, colIndex + 1).setValue(value);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}
  if (action === "getDailyTip") {
  const sheet = ss.getSheetByName("Daily Tips");
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const dayIndex = (today.getDate() - 1) % data.length; // Day 1 shows Row 2
  const tip = data[dayIndex][0] || "No tip available today.";
  return ContentService.createTextOutput(JSON.stringify({ tip }))
    .setMimeType(ContentService.MimeType.JSON);
}


if (action === "getLeaderboard") {
  const sheet = ss.getSheetByName("Leads");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);


  const idx = (col) => headers.indexOf(col);
  const map = {};


  rows.forEach(row => {
    const name = row[idx("Assigned To")] || "Unknown";
    const called = row[idx("Called?")] === "Yes" ? 1 : 0;
    const visit = row[idx("Site Visit?")] === "Yes" ? 1 : 0;
    const booked = row[idx("Booked?")] === "Yes" ? 1 : 0;


    if (!map[name]) {
      map[name] = { name, leads: 0, called: 0, siteVisits: 0, bookings: 0, score: 0 };
    }


    map[name].leads++;
    map[name].called += called;
    map[name].siteVisits += visit;
    map[name].bookings += booked;
  });


  // score: +1 for visit, +2 for booking
  for (let key in map) {
    const m = map[key];
    m.score = m.siteVisits * 2 + m.bookings * 5;
  }


  const result = Object.values(map).sort((a, b) => b.score - a.score);


  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}




if (action === "getUserTasks") {
  const sheet = ss.getSheetByName("Upcoming Tasks");
  const email = e.parameter.email?.toLowerCase();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);


  const result = rows
    .filter(row => row[0]?.toLowerCase() === email)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });


  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// ✅ Add new task
if (action === "addUserTask") {
  const sheet = ss.getSheetByName("Upcoming Tasks");
  const email = e.parameter.email;
  const task = e.parameter.task;


  if (!email || !task) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Missing parameters" }))
      .setMimeType(ContentService.MimeType.JSON);
  }


  sheet.appendRow([email, task, "Pending", new Date()]);
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ✅ Mark task as done
if (action === "markTaskDone") {
  const sheet = ss.getSheetByName("Upcoming Tasks");
  const email = e.parameter.email;
  const task = e.parameter.task;


  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  const taskIndex = rows.findIndex(row => row[0] === email && row[1] === task);


  if (taskIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Task not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }


  const rowNum = taskIndex + 2; // +1 for header, +1 for 0-index
  const statusCol = headers.indexOf("Status") + 1;
  sheet.getRange(rowNum, statusCol).setValue("Done");


  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}


if (action === "getTasks") {
  const sheet = ss.getSheetByName("Tasks");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);


  const result = rows
    .filter(row => row[headers.indexOf("Email")].toLowerCase() === email)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });


  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}


if (action === "getMonthlyChallenge") {
  const sheet = ss.getSheetByName("Monthly Challenge");
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const monthName = today.toLocaleString("default", { month: "long" }) + " " + today.getFullYear(); // e.g., May 2025


  Logger.log("Looking for challenge for: " + monthName);


  const headers = data[0];
  const rows = data.slice(1);


  const row = rows.find(r => r[0] === monthName);


  if (!row) {
    return ContentService.createTextOutput(JSON.stringify({ error: "No challenge set" })).setMimeType(ContentService.MimeType.JSON);
  }


  const siteVisitTarget = row[1];
  const bookingTarget = row[2];
  const prize = row[3] || "";


  const leadsSheet = ss.getSheetByName("Leads");
  const leads = leadsSheet.getDataRange().getValues();
  const h = leads[0];
  const r = leads.slice(1);


  const email = e.parameter.email?.toLowerCase();
  const idx = (col) => h.indexOf(col);
  const userRows = r.filter(row => (row[idx("Assigned Email")] || "").toLowerCase() === email);


  const visitDone = userRows.filter(row => row[idx("Site Visit?")] === "Yes").length;
  const bookedDone = userRows.filter(row => row[idx("Booked?")] === "Yes").length;


  const completed = visitDone >= siteVisitTarget && bookedDone >= bookingTarget;


  return ContentService.createTextOutput(JSON.stringify({
    month: monthName,
    siteVisitTarget,
    bookingTarget,
    prize,
    siteVisitDone: visitDone,
    bookingDone: bookedDone,
    completed
  })).setMimeType(ContentService.MimeType.JSON);
}


if (action === "getProjectInfo") {
  const brochureSheetId = "1s3j0Ngdrsk4r753jPl3DY5XCLFBeK7Zx1ck87WR-mec";
  const projectName = (e.parameter.project || "").trim().toLowerCase(); // 👈 lowercase here


  const ss = SpreadsheetApp.openById(brochureSheetId);
  const sheet = ss.getSheetByName("Sheet1"); // ✅ Use correct sheet tab name
  const data = sheet.getDataRange().getValues();
  const headers = data[0];


  const match = data.find((row, i) =>
    i > 0 && (row[0] || "").toString().trim().toLowerCase() === projectName // 👈 case-insensitive match
  );


  if (!match) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Project not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }


  const obj = {};
  headers.forEach((h, i) => obj[h] = match[i]);
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
    // 🔚 Default fallback
    throw new Error("Invalid action");


  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}


function handleLeadUpdate(params) {
  try {
    // Decode any URL-encoded parameters
    const decodedParams = {};
    for (const key in params) {
      try {
        // Decode the key and value
        const decodedKey = decodeURIComponent(key);
        let decodedValue = params[key];
        
        // Only decode if it's not a feedback field (to preserve + as spaces)
        if (!decodedKey.startsWith('Feedback')) {
          decodedValue = decodeURIComponent(decodedValue);
        }
        
        decodedParams[decodedKey] = decodedValue;
      } catch (e) {
        console.warn(`Error decoding parameter ${key}:`, e);
        decodedParams[key] = params[key];
      }
    }
    
    const { leadId, sheetName = 'Leads', ...updates } = decodedParams;
    
    // Get the spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    
    // Get the data and headers
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().trim());
    const leadIdCol = headers.findIndex(h => h.toLowerCase() === 'lead id');

    if (leadIdCol === -1) throw new Error("Lead ID column not found");

    // Find the row with the matching Lead ID
    const rowIndex = data.findIndex((row, i) => i > 0 && row[leadIdCol] && row[leadIdCol].toString().trim() === leadId.toString().trim());
    if (rowIndex === -1) throw new Error(`Lead with ID ${leadId} not found in ${sheetName}`);

    const actualRow = rowIndex + 1; // +1 because arrays are 0-based but rows are 1-based
    const updatesToMake = [];
    
    // Add debug logging
    console.log('Processing update for sheet:', sheetName);
    console.log('Headers:', headers);
    console.log('Decoded updates received:', JSON.stringify(decodedParams));
    
    // Prepare all updates
    for (const field in updates) {
      // Skip null, undefined or empty values
      if (updates[field] === null || updates[field] === undefined || updates[field] === '') continue;
      
      let colIndex = -1;
      let fieldValue = updates[field];
      let fieldName = field;
      
      // List of date fields that need special handling
      const dateFields = [
        'Site Visit Date', 'SiteVisitDate', 'Visit Date', 'Site Visit Date:',
        'Date', 'Followup Date', 'Next Followup', 'Followup'
      ];
      
      // Check if this is a date field
      const isDateField = dateFields.some(dateField => 
        field.toLowerCase().includes(dateField.toLowerCase())
      );
      
      // If it's a date field, ensure it's properly formatted
      if (isDateField && fieldValue) {
        try {
          // First check if it's already in YYYY-MM-DD format
          if (/^\d{4}-\d{2}-\d{2}$/.test(fieldValue)) {
            // Already in correct format, use as is
            console.log(`Using existing YYYY-MM-DD date format: '${fieldValue}' for field '${field}'`);
          } else {
            // Parse the date string and format it
            const date = new Date(fieldValue);
            if (!isNaN(date.getTime())) {
              // Format as YYYY-MM-DD for consistency
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              fieldValue = `${year}-${month}-${day}`;
              console.log(`Formatted date '${fieldValue}' for field '${field}'`);
            } else {
              console.warn(`Invalid date value '${fieldValue}' for field '${field}'`);
              continue; // Skip this field if date is invalid
            }
          }
        } catch (e) {
          console.error(`Error formatting date '${fieldValue}' for field '${field}':`, e);
          continue; // Skip this field if there's an error
        }
      }
      
      // Special handling for Manual Leads sheet
      if (sheetName === 'Manual Leads') {
        // Map field names to match the exact column names in the sheet
        const fieldMappings = {
          'Site Visit?': ['Site Visit?', 'SiteVisit', 'Site Visit'],
          'Site Visit Date': ['Site Visit Date', 'SiteVisitDate', 'Visit Date', 'Site Visit Date:'],
          'Booked?': ['Booked?', 'Booked', 'Status'],
          'Lead Quality': ['Lead Quality', 'LeadQuality', 'Quality'],
          'Looking For?': ['Looking For?', 'LookingFor', 'Requirement', 'Looking For'],
          'Feedback 1': ['Feedback 1', 'Feedback1', 'Feedback 1:'],
          'Feedback 2': ['Feedback 2', 'Feedback2', 'Feedback 2:'],
          'Feedback 3': ['Feedback 3', 'Feedback3', 'Feedback 3:'],
          'Feedback 4': ['Feedback 4', 'Feedback4', 'Feedback 4:'],
          'Feedback 5': ['Feedback 5', 'Feedback5', 'Feedback 5:']
        };
        
        // Special handling for site visit date - check this first
        if ((field.toLowerCase().includes('date') || field.toLowerCase().includes('sitevisit') || 
             field.toLowerCase() === 'site visit') && fieldValue) {
          // Try to find the date column
          const dateColIndex = headers.findIndex(h => {
            const header = h.toString().trim();
            return ['Site Visit Date', 'SiteVisitDate', 'Visit Date', 'Site Visit Date:'].some(
              dateHeader => header.toLowerCase() === dateHeader.toLowerCase()
            );
          });
          
          if (dateColIndex !== -1) {
            try {
              // Parse the date - handle both YYYY-MM-DD and other formats
              let date;
              if (fieldValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Already in YYYY-MM-DD format
                date = new Date(fieldValue);
              } else {
                // Try parsing as ISO string or other formats
                date = new Date(fieldValue);
              }
              
              if (!isNaN(date.getTime())) {
                // Format as YYYY-MM-DD for consistency
                fieldValue = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
                colIndex = dateColIndex;
                fieldName = headers[colIndex];
                console.log(`Formatted date for ${fieldName}: ${fieldValue}`);
                
                // Add to updates immediately since we found the date column
                updatesToMake.push({
                  row: actualRow,
                  col: colIndex + 1,
                  value: fieldValue,
                  field: fieldName,
                  originalField: field
                });
                continue; // Skip the rest of the loop for this field
              } else {
                console.warn(`Invalid date format for ${field}: ${fieldValue}`);
              }
            } catch (e) {
              console.error('Error formatting date:', e);
            }
          }
        }
        
        // Handle feedback fields (Feedback 1, Feedback 2, etc.)
        const feedbackMatch = field.match(/^feedback\s*(\d+)$/i);
        if (feedbackMatch) {
          const feedbackNum = feedbackMatch[1];
          const feedbackKey = `Feedback ${feedbackNum}`;
          
          // Try to find the feedback column using various possible header formats
          const feedbackColIndex = headers.findIndex(h => {
            const header = h.toString().trim();
            return (
              header === feedbackKey || 
              header === `Feedback${feedbackNum}` ||
              header === `Feedback ${feedbackNum}:` ||
              header.toLowerCase() === `feedback ${feedbackNum}`.toLowerCase() ||
              header.toLowerCase() === `feedback${feedbackNum}`.toLowerCase()
            );
          });
          
          if (feedbackColIndex !== -1) {
            colIndex = feedbackColIndex;
            fieldName = headers[colIndex];
            console.log(`Mapped feedback field '${field}' to '${fieldName}'`);
            
            // Add the feedback update immediately
            updatesToMake.push({
              row: actualRow,
              col: colIndex + 1,
              value: fieldValue,
              field: fieldName,
              originalField: field
            });
            continue; // Skip the rest of the loop for this field
          } else {
            console.warn(`Could not find column for feedback field: ${feedbackKey}`);
          }
        }
        
        // If we haven't found a column yet, try the field mappings
        if (colIndex === -1) {
          for (const [exactField, possibleFields] of Object.entries(fieldMappings)) {
            if (possibleFields.some(f => f.toLowerCase() === field.toLowerCase()) || 
                field.toLowerCase() === exactField.toLowerCase()) {
              
              const foundIndex = headers.findIndex(h => 
                possibleFields.some(pf => 
                  pf.toString().trim().toLowerCase() === h.toString().trim().toLowerCase()
                )
              );
              
              if (foundIndex !== -1) {
                colIndex = foundIndex;
                fieldName = headers[colIndex];
                console.log(`Mapped field '${field}' to '${fieldName}'`);
                break;
              }
            }
          }
        }
        
        // If column still not found, try direct case-insensitive match
        if (colIndex === -1) {
          const lowerField = field.toLowerCase();
          colIndex = headers.findIndex(h => 
            h.toString().trim().toLowerCase() === lowerField
          );
          if (colIndex !== -1) {
            fieldName = headers[colIndex];
            console.log(`Direct match found for '${field}': '${fieldName}'`);
          }
        }
      } else {
        // For other sheets, use the existing flexible matching
        const dateColHeaders = [
          'Site Visit Date', 
          'Site_Visit_Date', 
          'SiteVisitDate', 
          'Visit Date',
          'Site Visit',
          'VisitDate',
          'SiteVisit',
          'Site Visit Date:'
        ];
        
        // First try exact match
        colIndex = headers.findIndex(h => dateColHeaders.includes(h.toString().trim()));
        
        // If not found, try case-insensitive match
        if (colIndex === -1) {
          const lowerHeaders = headers.map(h => h.toString().toLowerCase());
          for (const dateHeader of dateColHeaders) {
            const idx = lowerHeaders.indexOf(dateHeader.toLowerCase());
            if (idx !== -1) {
              colIndex = idx;
              break;
            }
          }
        }
        
        // Handle other fields with flexible matching
        // First try exact match
        colIndex = headers.findIndex(h => 
          h.toString().trim().toLowerCase() === field.toLowerCase().trim()
        );
        
        // If not found, try other common date column names
        if (colIndex === -1) {
          for (const header of dateColHeaders) {
            colIndex = headers.findIndex(h => 
              h.toString().trim().toLowerCase() === header.toLowerCase().trim()
            );
            if (colIndex !== -1) break;
          }
        }
        
        // If still not found, try partial match
        if (colIndex === -1) {
          const lowerField = field.toLowerCase();
          colIndex = headers.findIndex(h => 
            h.toString().toLowerCase().includes('site') && 
            h.toString().toLowerCase().includes('date')
          );
        }
        
        // If we haven't found a column yet, try to find it by name
        if (colIndex === -1) {
          colIndex = headers.findIndex(h => 
            h.toString().trim().toLowerCase() === fieldName.toString().toLowerCase()
          );
        }
        
        // If we found a column for this field, add it to the updates
        if (colIndex !== -1) {
          // For debugging
          console.log(`Updating ${fieldName} (col ${colIndex + 1}) with value:`, fieldValue);
          
          updatesToMake.push({
            row: actualRow,
            col: colIndex + 1, // +1 because columns are 1-based in setValue
            value: fieldValue
          });
        } else {
          console.warn(`Column not found for field: ${fieldName}`);
        }
      }
      
      // Special handling for Manual Leads sheet
      if (sheetName === 'Manual Leads') {
        // Map common field variations for Manual Leads
        const fieldMappings = {
          'sitevisit': 'Site Visit?',
          'site visit': 'Site Visit?',
          'booked': 'Booked?',
          'leadquality': 'Lead Quality',
          'lead quality': 'Lead Quality',
          'lookingfor': 'Looking For',
          'looking for': 'Looking For',
          'feedback1': 'Feedback 1',
          'feedback 1': 'Feedback 1',
          'feedback2': 'Feedback 2',
          'feedback 2': 'Feedback 2',
          'feedback3': 'Feedback 3',
          'feedback 3': 'Feedback 3',
          'feedback4': 'Feedback 4',
          'feedback 4': 'Feedback 4',
          'feedback5': 'Feedback 5',
          'feedback 5': 'Feedback 5'
        };
        
        const normalizedField = field.toLowerCase().trim();
        if (fieldMappings[normalizedField]) {
          colIndex = headers.findIndex(h => h === fieldMappings[normalizedField]);
          if (colIndex !== -1) {
            console.log(`Mapped field '${field}' to '${fieldMappings[normalizedField]}'`);
          }
        }
      }
      // Only add to updates if we have a valid column index and we haven't already added this update
      if (colIndex !== -1) {
        // Check if we already have an update for this column to avoid duplicates
        const existingUpdateIndex = updatesToMake.findIndex(
          u => u.row === actualRow && u.col === colIndex + 1
        );
        
        if (existingUpdateIndex === -1) {
          updatesToMake.push({
            row: actualRow,
            col: colIndex + 1, // +1 because columns are 1-based in setValue
            value: fieldValue,
            field: headers[colIndex],
            originalField: field
          });
          console.log(`Added update for ${fieldName} (col ${colIndex + 1}):`, fieldValue);
        } else {
          // Update existing update if needed
          updatesToMake[existingUpdateIndex].value = fieldValue;
          console.log(`Updated existing update for ${fieldName} (col ${colIndex + 1}):`, fieldValue);
        }
      } else {
        console.warn(`Field not found: '${field}' in sheet '${sheetName}'. Headers:`, headers);
      }
    }
    
    // Apply all updates in a single batch
    if (updatesToMake.length > 0) {
      console.log('Applying updates:', JSON.stringify(updatesToMake, null, 2));
      
      // Group updates by row to minimize API calls
      const updatesByRow = {};
      updatesToMake.forEach(update => {
        if (!updatesByRow[update.row]) {
          updatesByRow[update.row] = [];
        }
        updatesByRow[update.row].push(update);
      });
      
      // Apply updates for each row
      for (const row in updatesByRow) {
        const rowUpdates = updatesByRow[row];
        const rowRange = sheet.getRange(parseInt(row), 1, 1, sheet.getLastColumn());
        const rowData = [rowRange.getValues()[0]];
        
        // Apply each update to the row data
        rowUpdates.forEach(update => {
          rowData[0][update.col - 1] = update.value;
        });
        
        // Write the updated row data back to the sheet
        rowRange.setValues(rowData);
      }
      
      SpreadsheetApp.flush();
      console.log('Updates applied successfully');
    } else {
      console.warn('No valid updates to apply');
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      updatedFields: updatesToMake.length,
      updates: updatesToMake.map(u => ({
        field: u.field,
        originalField: u.originalField,
        value: u.value,
        row: u.row,
        col: u.col
      }))
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    console.error('Error in handleLeadUpdate:', err);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message,
      stack: err.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // This is no longer used but kept for backward compatibility
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Please use GET with URL parameters instead of POST'
  })).setMimeType(ContentService.MimeType.JSON);
}
