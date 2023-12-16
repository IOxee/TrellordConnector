const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
const port = 80;

require('dotenv').config();
const trelloApiKey = process.env.TRELLO_API_KEY;
const trelloToken = process.env.TRELLO_TOKEN;


app.use(bodyParser.json());

let trelloData = {};

app.post('/updateConfig', (req, res) => {
    trelloData = req.body;
    res.send('Configuración actualizada');
});

async function checkForChanges() {
    if (!trelloData.boardId || !trelloData.webhookUrl) return;

    try {
        const response = await fetch(`https://api.trello.com/1/boards/${trelloData.boardId}/cards?key=${trelloApiKey}[YourTrelloAPIKey]&token=${trelloToken}`);
        const cards = await response.json();

        

        // Aquí implementas la lógica para detectar cambios y enviar notificaciones

    } catch (error) {
        console.error('Error al consultar la API de Trello:', error);
    }
}

setInterval(checkForChanges, 60000); // Comprueba cambios cada minuto

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
