const express = require("express");
const axios = require("axios");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const folder = path.join(__dirname, "temp");
if (!fs.existsSync(folder)) fs.mkdirSync(folder);

app.post("/download", async (req, res) => {
    const url = req.body.url;

    if (!url) {
        return res.status(400).send("No URL");
    }

    try {
        const fileName = "video_" + Date.now() + ".mp4";
        const filePath = path.join(folder, fileName);

        const response = await axios({
            url,
            method: "GET",
            responseType: "stream",
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        // 🔥 VALIDAR QUE SEA VIDEO
        const contentType = response.headers["content-type"];

        if (!contentType || !contentType.includes("video")) {
            return res.status(400).send("El link no es un video directo");
        }

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on("finish", () => {
            res.download(filePath, fileName, () => {
                fs.unlink(filePath, () => {});
            });
        });

        writer.on("error", () => {
            res.status(500).send("Error al guardar archivo");
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Error al descargar");
    }
});

app.listen(3000, () => {
    console.log("Servidor en http://localhost:3000");
});