require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Configuración desde variables de entorno
const {
  TELEGRAM_TOKEN,
  TELEGRAM_CHAT_ID,
  NOTION_TOKEN, // Asegúrate que empiece con "secret_"
  DATABASE_ID
} = process.env;

app.use(express.json());

// Ruta del webhook para Notion (¡VERIFICA QUE ESTÉ BIEN ESCRITA!)
app.post('/notion-webhook', async (req, res) => {
  try {
    console.log('Webhook recibido:', req.body);
    const { results } = req.body;

    if (results?.length > 0) {
      for (const result of results) {
        const pageData = await getNotionPageDetails(result.id);
        await sendTelegramAlert(pageData);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error crítico:', error);
    res.status(500).send('Error interno');
  }
});

// Obtener datos de Notion
async function getNotionPageDetails(pageId) {
  try {
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
  } catch (error) {
    console.error('Error al obtener datos de Notion:', error.response?.data || error.message);
    throw error;
  }
}

// Función auxiliar para propiedades
function getPropertyValue(properties, name, type) {
  const prop = properties[name];
  if (!prop) return 'N/A';

  if (type === 'title') {
    return prop.title[0]?.plain_text || 'Sin título';
  } else if (type === 'number') {
    return prop.number !== null ? `${prop.number}%` : 'N/A';
  }
  return 'N/A';
}

// Enviar alerta a Telegram
async function sendTelegramAlert(data) {
  try {
    const message = `🚨 **Nuevo Registro de Producción**
*Proyecto*: ${data.proyecto}
*Semana*: ${data.semana}
*Producción*: ${data.produccion}`;

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error al enviar a Telegram:', error.response?.data || error.message);
  }
}

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor activo en http://localhost:${port}`);
});