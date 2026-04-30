require("dotenv").config()

const express = require("express")
const cors = require("cors")
const axios = require("axios")

const app = express()
const PORT = process.env.PORT || 5000

// Delivery pricing constants (override via env vars for easy reconfiguration)
const DELIVERY_BASE_FEE = parseFloat(process.env.DELIVERY_BASE_FEE) || 2
const DELIVERY_PER_KM_RATE = parseFloat(process.env.DELIVERY_PER_KM_RATE) || 0.5

// ─── Middleware ───────────────────────────────────────────────
app.use(express.json())

app.use(
  cors({
    origin: [
      "https://daloelsalvador.com",
      "https://www.daloelsalvador.com",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
)

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// ─── Routes ───────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).send("Dalo API running 🚚")
})

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "dalo-api" })
})

app.post("/api/calculate", async (req, res) => {
  try {
    const { cantidad, address } = req.body

    if (!cantidad || !address) {
      return res
        .status(400)
        .json({ error: "cantidad and address are required" })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    const warehouseLat = process.env.WAREHOUSE_LAT
    const warehouseLng = process.env.WAREHOUSE_LNG

    if (!apiKey || !warehouseLat || !warehouseLng) {
      return res.status(500).json({ error: "Server configuration error" })
    }

    const origin = `${warehouseLat},${warehouseLng}`

    const { data } = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins: origin,
          destinations: address,
          units: "metric",
          key: apiKey,
        },
      }
    )

    const element = data?.rows?.[0]?.elements?.[0]
    if (!element || element.status !== "OK") {
      return res.status(400).json({
        error: `Could not calculate distance for the provided address (${element?.status ?? "NO_RESULTS"})`,
      })
    }

    const distanceKm = element.distance.value / 1000
    const durationText = element.duration.text

    // Delivery cost: base fee + per-km rate, multiplied by quantity
    const unitCost = DELIVERY_BASE_FEE + DELIVERY_PER_KM_RATE * distanceKm
    const totalCost = +(unitCost * Number(cantidad)).toFixed(2)

    res.json({
      success: true,
      distanceKm: +distanceKm.toFixed(2),
      duration: durationText,
      cantidad: Number(cantidad),
      totalCost,
      currency: "USD",
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Internal server error" })
  }
})

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Dalo server running on port ${PORT}`)
})
