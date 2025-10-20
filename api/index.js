import axios from "axios";

// === KONFIGURASI ===
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const data = req.body;

  // --- Validasi input wajib ---
  const requiredFields = [
    "terminal_id",
    "trx_id",
    "amount",
    "custom_ref",
    "created_at",
    "status",
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      const msg = `❌ Missing field: ${field}. Data: ${JSON.stringify(data)}`;
      console.log(msg);
      return res.status(400).json({ success: false, message: msg });
    }
  }

  // --- Ambil data utama ---
  const userqris = data.terminal_id.trim();
  const trxid = data.trx_id.trim();
  const amount = Number(data.amount);
  const custom_ref = data.custom_ref.trim();
  const created_at = data.created_at.trim();
  const status = data.status.toLowerCase();

  // --- Logging awal ---
  console.log(`Callback received: ${JSON.stringify(data)}`);

  // --- Cek status transaksi ---
  let notifMessage = "";
  if (status === "success") {
    notifMessage = `✅ *Topup QRIS Sukses*\n\n🧍User: ${userqris}\n💰Nominal: Rp${amount.toLocaleString()}\n🆔Trx ID: ${trxid}\n🕒Waktu: ${created_at}\n🔖Ref: ${custom_ref}`;
  } else {
    notifMessage = `⚠️ *Topup QRIS Gagal/Pending*\n\n🧍User: ${userqris}\n💰Nominal: Rp${amount.toLocaleString()}\n🆔Trx ID: ${trxid}\n🕒Waktu: ${created_at}\n📍Status: ${status}`;
  }

  // --- Kirim notifikasi ke Telegram ---
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: notifMessage,
      parse_mode: "Markdown",
    });
    console.log("Telegram notification sent successfully.");
  } catch (err) {
    console.error("Failed to send Telegram notification:", err.message);
  }

  // --- Respon ke server QRIS ---
  return res.status(200).json({ success: true, message: "Callback processed successfully" });
}
