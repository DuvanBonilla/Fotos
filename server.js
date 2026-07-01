require("dotenv").config();

const express = require("express");
const path = require("path");
const { Resend } = require("resend");

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/location", async (req, res) => {
  try {
    const data = req.body;
    const gps = data.gps || {};

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "N/A";

    const maps =
      gps.ok && gps.lat && gps.lon
        ? `https://www.google.com/maps?q=${gps.lat},${gps.lon}`
        : "No disponible";

    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL,
      subject: "Nuevo punto georreferenciado",
      html: `
        <h2>Nuevo punto georreferenciado</h2>

        <p><b>Fecha servidor:</b> ${new Date().toLocaleString("es-CO")}</p>
        <p><b>IP:</b> ${ip}</p>

        <h3>Ubicación</h3>
        <p><b>Latitud:</b> ${gps.lat ?? "N/A"}</p>
        <p><b>Longitud:</b> ${gps.lon ?? "N/A"}</p>
        <p><b>Precisión:</b> ${gps.acc ?? "N/A"} metros</p>
        <p><b>Google Maps:</b> <a href="${maps}">${maps}</a></p>

        <h3>Datos recibidos</h3>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `,
    });

    res.json({ ok: true, maps });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, msg: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});