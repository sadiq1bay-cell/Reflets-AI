# Reflets

Reflets; **Reflets Crush**, **Reflets Aura** ve **Reflets Void** motorlarıyla hızlı sohbet akışı (SSE), çok modlu görsel/video analizi, WebSocket tabanlı **Canlı Asistan** ve **Topluluk Soruları** özelliklerini tek uygulamada sunan tam yığın yapay zeka uygulamasıdır.

## ZIP İndir → GitHub → Vercel Yayınlama Rehberi

1. **GitHub'a Yükleme (Neden `.env.example` içine anahtar yazılmaz?)**
   - `.env.example` içine gerçek bir API anahtarı (`AIza...` vb.) yazarsanız **GitHub Secret Scanning / Push Protection** güvenliğiniz için yüklemeyi reddeder.
   - `.env.example` sadece şablondur; `GEMINI_API_KEY="MY_GEMINI_API_KEY"` şeklinde kalmalıdır.
   - ZIP içindeki tüm dosyaları (`api/`, `src/`, `index.html`, `package.json`, `vercel.json`, `.env.example` vb.) doğrudan GitHub deponuza yükleyin (`.env` dosyasını asla GitHub'a koymayın).

2. **Vercel'e Bağlama ve API Anahtarını Ekleme**
   - Vercel'de **Add New Project** diyerek GitHub deponuzu seçin (`vercel.json` sayesinde Vite + `api/` Serverless Functions otomatik algılanır).
   - **Environment Variables** bölümüne şu değişkeni ekleyin:
     - **Name:** `GEMINI_API_KEY`
     - **Value:** Google AI Studio'dan aldığınız `AIza...` ile başlayan geçerli Gemini API anahtarınız
   - **Deploy** düğmesine basın.

> **Not (Canlı Asistan WebSocket):** Vercel Serverless Functions kalıcı WebSocket sunucusu desteklemediği için Vercel üzerinde `Sohbet` (Crush / Aura / Void), `Görsel / Video Analizi` ve `Topluluk Soruları` tam performansla çalışır; gerçek zamanlı sesli/kameralı `Canlı Asistan` için Node.js sunucusu (`npm start` / AI Studio / Render / Railway) gerekir.

## Yerelde Çalıştırma

```bash
npm install
cp .env.example .env
# .env dosyasının içine GEMINI_API_KEY="AIza..." değerini yazın
npm run dev
```
Tarayıcıda `http://localhost:3000` adresini açın.
