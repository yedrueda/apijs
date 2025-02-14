require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Configuración desde variables de entorno
const {
  TELEGRAM_TOKEN,
  TELEGRAM_CHAT_ID,
  NOTION_TOKEN,
  DATABASE_ID
} = process.env;

app.use(express.json());

// Webhook para Notion
app.post('/notion-webhook', async (req, res) => {
  try {
    const { results } = req.body;
    
    if (results && results.length > 0) {
      for (const result of results) {
        const pageData = await getNotionPageDetails(result.id);
        await sendTelegramAlert(pageData);
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error interno');
  }
});

// Obtener detalles de la página de Notion
async function getNotionPageDetails(pageId) {
  const response = await axios.get(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28'
    }
  });

  const properties = response.data.properties;
  
  return {
    proyecto: getPropertyValue(properties, 'PROYECTO', 'title'),
    semana: getPropertyValue(properties, 'SEMANA', 'number'),
    produccion: getPropertyValue(properties, 'PRODUCCION', 'number')
  };
}

// Función auxiliar para propiedades
function getPropertyValue(properties, name, type) {
  const prop = properties[name];
  if (!prop) return 'N/A';

  if (type === 'title') {
    return prop.title[0]?.plain_text || 'Sin título';
  } else if (type === 'number') {
    return prop.number ? `${prop.number}%` : 'N/A';
  }
  return 'N/A';
}

// Enviar mensaje a Telegram
async function sendTelegramAlert(data) {
  const message = `🚨 **Nuevo Registro de Producción**
*Proyecto*: ${data.proyecto}
*Semana*: ${data.semana}
*Producción*: ${data.produccion}`;

  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'Markdown'
  });
}

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});