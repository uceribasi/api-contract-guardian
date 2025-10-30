# api-contract-guardian

[![NPM Version](https://img.shields.io/npm/v/api-contract-guardian.svg)](https://www.npmjs.com/package/api-contract-guardian)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Şu dilde de mevcut: [İngilizce](README.md)**

---

Üretime ulaşmadan *önce* API sözleşmesi (contract) ihlallerini önlemek için CI-dostu bir CLI aracı.

## Sorun

Ön uç (frontend) ve arka uç (backend) ekipleri arasındaki API sözleşmeleri (OpenAPI/Swagger) sürekli evrilir. Ancak, frontend ekipleri bir değişikliği (ör. bir endpoint’in yeniden adlandırılması ya da `GET` metodunun `POST`’a dönmesi) gözden kaçırabilir.

Bu hatalar çoğu zaman fark edilmez ve kod “başarıyla” pipeline’dan geçip birleştirilir. Sonuç: üretimde patlayan çalışma zamanı (runtime) hataları.

## ✨ Çözüm

`api-contract-guardian`, kod tabanınızı statik olarak tarar, `fetch` ve `axios` ile yapılan tüm API çağrılarını bulur ve bunları OpenAPI sözleşmenize karşı doğrular.

Eğer sözleşmeyle eşleşmeyen bir çağrı (yanlış path veya yanlış HTTP yöntemi) bulursa `process.exit(1)` ile çıkar; CI hattınızı başarısız yapar ve sizi anında uyarır.

## ⚙️ Nasıl Çalışır

Bu araç kodunuzu çalıştırmaz. Onun yerine:

1. `--glob` deseninizle belirttiğiniz tüm `js`, `jsx`, `ts` ve `tsx` dosyalarını okumak için `ts-morph` kullanır.  
2. Kodunuzun Soyut Sözdizimi Ağacı’nı (AST) oluşturur.  
3. Bu ağacı dolaşarak tüm API çağrılarının (ör. `fetch(...)`, `axios.get(...)`) yol (path) ve yöntemlerini statik olarak bulur.  
4. Bulunan tüm çağrıları `--openapi` URL’sinden alınan sözleşme listesiyle karşılaştırır.  
5. Eşleşme yoksa süreci başarısız eder.

## 📦 Kurulum

Aracı global kurabilir veya projenize `devDependency` olarak ekleyebilirsiniz.

### Global Kurulum

```bash
npm install -g api-contract-guardian
```

### Yerel Kurulum (CI/CD için Önerilir)

```bash
npm install --save-dev api-contract-guardian
```

## 🚀 Kullanım

Ana komut `run`’dır ve iki argüman ister:

```bash
api-guardian run --openapi <url> --glob <pattern>
```

### Argümanlar

- `--openapi <url>` **(Zorunlu):** Doğrulama için kullanılacak OpenAPI (Swagger) sözleşmenizin `api-docs.json` adresi.  
  **Örn.:** `https://petstore.swagger.io/v2/swagger.json`

- `--glob <pattern>` **(Zorunlu):** Taranacak dosyaları eşleyecek glob deseni.  
  **Örn.:** `"src/**/*.{ts,tsx}"`

## 🧪 Örnekler

### 1) Yalnızca `src` klasöründeki TypeScript dosyalarını tara

```bash
api-guardian run   --openapi "https://api.example.com/swagger.json"   --glob "src/**/*.{ts,tsx}"
```

### 2) Bir Next.js App Router projesini tara

```bash
api-guardian run   --openapi "https://api.example.com/swagger.json"   --glob "app/**/*.{ts,tsx}"
```

### 3) Projedeki tüm script dosyalarını tara (performanslı)

> Hız için `node_modules`, `dist`, `.git` vb. dizinleri otomatik olarak yok sayar.

```bash
api-guardian run   --openapi "https://api.example.com/swagger.json"   --glob "**/*.{js,jsx,ts,tsx}"
```

## 🤖 CI/CD Entegrasyonu

Bu aracın gerçek gücü otomasyonda. CI hattınızın (ör. GitHub Actions, GitLab CI) bir parçası yapmak için `package.json`’a bir script ekleyin.

**`package.json` dosyanıza ekleyin:**

```json
{
  "scripts": {
    "test": "...",
    "build": "...",
    "check:api": "api-guardian run --openapi \"https://api.example.com/swagger.json\" --glob \"src/**/*.{ts,tsx}\""
  }
}
```

Artık CI hattınız sadece şunu çalıştırabilir:

```bash
npm run check:api
```

Bir ihlal varsa hat (pipeline) durur.

## 📄 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır.  
**Yazar:** Uğur Can Ceribaşı
