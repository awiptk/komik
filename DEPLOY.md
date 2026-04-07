# 🚀 Deployment Guide: Komik Agregator

## Platform Support
- ✅ Railway (Existing - NIXPACKS)
- ✅ Fly.io (New - Dockerfile)
- ✅ Docker compatible

---

## 📋 Struktur Files

```
komik-agregator/
├── api/
│   ├── _utils.js          # Utilities & fetchers
│   ├── latest.js          # Latest endpoint
│   ├── popular.js         # Popular endpoint
│   └── search.js          # Search endpoint
├── source/
│   ├── kiryuu.js          # Kiryuu proxy
│   ├── komikcast.js       # Komikcast proxy
│   └── shinigami.js       # Shinigami proxy
├── server.js              # Main server
├── index.html             # Frontend
├── package.json
├── railway.json           # Railway config
├── fly.toml               # Fly.io config (NEW)
├── Dockerfile             # Docker image (NEW)
├── .dockerignore          # Docker ignore (NEW)
└── .env.example           # Env example (NEW)
```

---

## 🚀 Deploy to Fly.io

### Option 1: Via Web Dashboard (Recommended - No CLI needed)

1. **Signup/Login ke [fly.io](https://fly.io)**

2. **Connect GitHub**
   - Dashboard → New App → Deploy from Git
   - Select your repo
   - Fly.io auto-detect dari `fly.toml`

3. **Set Environment Variables** (jika ada)
   - Dashboard → App Settings → Secrets
   - Biarkan kosong jika tidak ada custom config

4. **Deploy**
   - Automatic setiap push ke main branch
   - atau manual: Dashboard → Deploy

### Option 2: Via CLI (Jika perlu)

```bash
# Install (tapi besar, skip jika bisa)
# curl -L https://fly.io/install.sh | sh

# Atau deploy via web dashboard lebih simple
```

---

## 🔄 Dual Deployment Strategy

### Railway (Current)
- Config: `railway.json`
- Builder: NIXPACKS
- Trigger: Auto-detect atau manual

### Fly.io (New)
- Config: `fly.toml`
- Builder: Dockerfile (Docker)
- Trigger: Auto-detect atau manual

**Keduanya bisa jalan parallel!**

---

## ✅ Pre-Deployment Checklist

- [ ] `fly.toml` sudah ada
- [ ] `Dockerfile` sudah ada
- [ ] `.dockerignore` sudah ada
- [ ] `package.json` valid (Node 20)
- [ ] Server di-listen di `process.env.PORT || 3000`
- [ ] Tidak ada hardcoded secrets di kode

---

## 🧪 Test Local dengan Docker

```bash
# Build image
docker build -t komik-agregator .

# Run container
docker run -p 3000:3000 komik-agregator

# Test
curl http://localhost:3000
```

---

## 📊 Performance Expectations

### Fly.io Free Tier
- **CPU**: 1 shared vCPU
- **RAM**: 256 MB
- **Storage**: 3 GB
- **Uptime**: 24/7
- **Bandwidth**: Unlimited

### For Komik Agregator
- ✅ **Parsing 3 APIs** = CPU efficient
- ✅ **CORS headers** = No bottleneck
- ✅ **Frontend HTML** = Minimal overhead
- ✅ **Expected latency**: <500ms (Asia region)

---

## 🔗 URLs Setelah Deploy

### Railway
```
https://komik-agregator-railway.railway.app
```

### Fly.io
```
https://komik-agregator.fly.dev
```

---

## 🛠️ Troubleshooting

### App tidak start
- Check logs: Dashboard → Logs
- Verify `PORT` env variable
- Verify `node --version >= 20`

### API endpoints 404
- Check routes di `server.js`
- Verify path `/api/search`, `/api/latest`, etc.

### CORS issues
- CORS headers sudah di-set di `server.js`
- No additional config needed

### Performance slow
- Check network latency
- Verify region: Fly.io using `sin` (Singapore)
- Monitor: Dashboard → Metrics

---

## 📈 Monitoring

### Fly.io Dashboard
- Logs realtime
- CPU & Memory metrics
- Restart history
- Request count

### Health Check
- Fly.io pings `/` setiap 30s
- Expected response: 200 OK

---

## 🔐 Security Notes

- No secrets in `.env.example`
- Use Dashboard for actual secrets
- HTTPS automatic di Fly.io
- CORS allows `*` (adjust jika diperlukan)

---

## 📞 Support

- **Fly.io Docs**: https://fly.io/docs
- **Railway Docs**: https://railway.app/docs
- **Docker Docs**: https://docs.docker.com

---

## ✨ Next Steps

1. Push code ke GitHub (jika belum)
2. Login ke Fly.io
3. Connect GitHub repo
4. Auto-deploy trigger
5. Test endpoints
6. Update extension manifest dengan URL baru

Happy deploying! 🎉
