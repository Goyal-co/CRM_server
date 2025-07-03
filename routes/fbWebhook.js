// import express from 'express';
// import axios from 'axios';

// const VERIFY_TOKEN = 'titan_verify';
// const PAGE_ACCESS_TOKEN = 'EAATT84b6A0MBOZC5eivZAYnEjkWfZAqxzZCiFacZCNnZCFPLM07ASuRhcw8olsZCx8K1ColBEZBuYH6fTNCPcGSpFx632M7qtCxE3YEphs34ic4ZAc7fqs1CgOUMfehwjAq2qonBU1mfeBKnqUwpVkZBA5KCg4tP8sknOufz1lDBCvANQZBQRrUEn122BqumkfUXU3sUC8u';

// const router = express.Router();

// const GOOGLE_SCRIPT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwzfrMTurwHJ7BllZuCpMLzrmZC8nOraJ2eEOhY4ZCuWgWn50zZ3A4nwwb-a9tTdAmr/exec';

// async function appendLeadToSheetPublic(lead) {
//   await axios.post(GOOGLE_SCRIPT_WEBAPP_URL, lead, {
//     headers: { 'Content-Type': 'application/json' }
//   });
// }

// router.post('/fb-webhook', async (req, res) => {
//   try {
//     console.log('📨 Webhook POST hit');
//     console.log('📦 Raw Body:', JSON.stringify(req.body, null, 2));

//     let leadsAdded = 0;
//     for (const entry of req.body.entry || []) {
//       for (const change of entry.changes || []) {
//         if (change.field === 'leadgen') {
//           const leadId = change.value.leadgen_id;
//           const formId = change.value.form_id;
//           const pageId = change.value.page_id;

//           console.log('📥 New Lead ID:', leadId);
//           console.log('📝 Form ID:', formId);
//           console.log('📄 Page ID:', pageId);

//           let lead = {
//             leadId,
//             project: '', // Set if you have a project value
//             source: 'Facebook',
//           };

//           // Try to fetch full lead data from Facebook
//           try {
//             const response = await axios.get(
//               `https://graph.facebook.com/v19.0/${leadId}`,
//               {
//                 params: {
//                   access_token: PAGE_ACCESS_TOKEN,
//                   fields: 'field_data,created_time'
//                 }
//               }
//             );
//             console.log('✅ Full Lead Data:', JSON.stringify(response.data, null, 2));
//             const fields = response.data.field_data;
//             // Dynamically add all field_data fields to the lead object
//             if (Array.isArray(fields)) {
//               fields.forEach(f => {
//                 if (f.name && Array.isArray(f.values)) {
//                   lead[f.name] = f.values[0] || '';
//                 }
//               });
//             }
//           } catch (err) {
//             console.error('❌ Lead fetch failed:', err.message, err.response?.data || '');
//           }

//           // Always append to Google Sheet, even if Facebook fetch fails
//           try {
//             await appendLeadToSheetPublic(lead);
//             leadsAdded++;
//           } catch (sheetErr) {
//             console.error('❌ Failed to append to Google Sheet:', sheetErr);
//           }
//         } else {
//           console.log('⚠️ Not a leadgen field:', change?.field);
//         }
//       }
//     }

//     console.log(`✅ Leads added to sheet: ${leadsAdded}`);
//     res.sendStatus(200);
//   } catch (err) {
//     console.error('❌ Webhook error:', err.message);
//     res.sendStatus(500);
//   }
// });

// export default router;



import express from 'express';
import axios from 'axios';

const router = express.Router();

const VERIFY_TOKEN = 'titan_verify';
const PAGE_ACCESS_TOKEN = 'EAATT84b6A0MBOZC5eivZAYnEjkWfZAqxzZCiFacZCNnZCFPLM07ASuRhcw8olsZCx8K1ColBEZBuYH6fTNCPcGSpFx632M7qtCxE3YEphs34ic4ZAc7fqs1CgOUMfehwjAq2qonBU1mfeBKnqUwpVkZBA5KCg4tP8sknOufz1lDBCvANQZBQRrUEn122BqumkfUXU3sUC8u';

const GOOGLE_SCRIPT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwzfrMTurwHJ7BllZuCpMLzrmZC8nOraJ2eEOhY4ZCuWgWn50zZ3A4nwwb-a9tTdAmr/exec';

async function appendLeadToSheetPublic(lead) {
  await axios.post(GOOGLE_SCRIPT_WEBAPP_URL, lead, {
    headers: { 'Content-Type': 'application/json' }
  });
}

router.post('/fb-webhook', async (req, res) => {
  try {
    console.log('📨 Webhook POST hit');
    console.log('📦 Raw Body:', JSON.stringify(req.body, null, 2));

    let leadsAdded = 0;
    for (const entry of req.body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'leadgen') {
          const leadId = change.value.leadgen_id;
          const formId = change.value.form_id;
          const pageId = change.value.page_id;

          console.log('📥 New Lead ID:', leadId);
          console.log('📝 Form ID:', formId);
          console.log('📄 Page ID:', pageId);

          let lead = {
            leadId,
            project: formId || 'FB Form', // Default project name
            source: 'Facebook',
          };

          // ✅ Try fetching lead details from FB
          try {
            const response = await axios.get(
              `https://graph.facebook.com/v19.0/${leadId}`,
              {
                params: {
                  access_token: PAGE_ACCESS_TOKEN,
                  fields: 'field_data,created_time'
                }
              }
            );
            console.log('✅ Full Lead Data:', JSON.stringify(response.data, null, 2));

            const fields = response.data.field_data;
            if (Array.isArray(fields)) {
              fields.forEach(f => {
                if (f.name && Array.isArray(f.values)) {
                  lead[f.name] = f.values[0] || '';
                }
              });
            }
          } catch (err) {
            console.error('❌ Lead fetch failed:', err.message, err.response?.data || '');
          }

          // ✅ Always try to send to Apps Script
          try {
            await appendLeadToSheetPublic(lead);
            leadsAdded++;
          } catch (sheetErr) {
            console.error('❌ Failed to append to Google Sheet:', sheetErr.message);
          }
        } else {
          console.log('⚠️ Skipping non-leadgen field:', change?.field);
        }
      }
    }

    console.log(`✅ Leads added to sheet: ${leadsAdded}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.sendStatus(500);
  }
});

export default router;
