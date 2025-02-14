require('dotenv').config();
const axios = require('axios');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.DATABASE_ID;

axios.post('https://api.notion.com/v1/subscriptions', {
  parent: { database_id: DATABASE_ID },
  event_types: ["page.added"]
}, {
  headers: {
    'Authorization': `Bearer ${NOTION_TOKEN}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28'
  }
})
.then(response => {
  console.log('Webhook configurado:', response.data);
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});