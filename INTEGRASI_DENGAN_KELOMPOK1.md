# Dokumentasi Integrasi dengan Kelompok 1 (TUBES js v2)

## 📋 Overview

Dokumen ini menjelaskan bagaimana **Kelompok 2 (IAE_TuBes-front-end)** mengintegrasikan dan mengkonsumsi service dari **Kelompok 1 (TUBES js v2)**.

## 🔗 Service yang Dikonsumsi

### Flight Schedule Service dari Kelompok 1

**Endpoint**: `http://host.docker.internal:4002`  
**Service**: Flight Schedule Service (TUBES js v2)  
**Port External**: 4002

## 📊 Schema GraphQL Kelompok 1

### Type FlightSchedule

```graphql
type FlightSchedule {
  id: ID!
  flightCode: String!
  aircraftType: String!
  departureLocation: String!
  destinationLocation: String!
  departureTime: String!
  arrivalTime: String!
  price: Float!
  totalSeats: Int!
  availableSeats: Int!
  status: String!
}
```

### Query yang Tersedia

```graphql
type Query {
  flightSchedules(...): [FlightSchedule]
  flightById(id: ID!): FlightSchedule
  flightByCode(flightCode: String!): FlightSchedule
}
```

## 🚀 Implementasi di Kelompok 2

### 1. Environment Variable

**File**: `docker-compose.yml`

```yaml
booking-service:
  environment:
    - KELOMPOK1_FLIGHT_SCHEDULE_SERVICE=http://host.docker.internal:4002
```

### 2. Helper Function

**File**: `booking-service/index.js`

```javascript
// Helper function untuk mengambil flight schedule dari Kelompok 1
async function getKelompok1FlightSchedule(flightCode) {
  try {
    const response = await axios.post(
      `${KELOMPOK1_FLIGHT_SCHEDULE_SERVICE}`,
      {
        query: `
          query {
            flightByCode(flightCode: "${flightCode}") {
              id
              flightCode
              departureLocation
              destinationLocation
              departureTime
              arrivalTime
              price
              availableSeats
              status
            }
          }
        `
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.flightByCode;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Tidak dapat terhubung ke flight schedule service kelompok 1: ${KELOMPOK1_FLIGHT_SCHEDULE_SERVICE}`);
    }
    throw new Error(`Gagal mengambil flight schedule dari kelompok 1: ${error.message}`);
  }
}
```

### 3. GraphQL Schema

**File**: `booking-service/index.js`

```graphql
# Type untuk flight schedule dari Kelompok 1
type Kelompok1FlightSchedule {
  id: ID!
  flightCode: String!
  departureLocation: String!
  destinationLocation: String!
  departureTime: String!
  arrivalTime: String!
  price: Float!
  availableSeats: Int!
  status: String!
}

extend type Query {
  myBookings: [Booking]
  bookingById(id: ID!): Booking  # Untuk integrasi lintas kelompok
  # Query untuk mengambil flight schedule dari Kelompok 1
  kelompok1FlightSchedule(flightCode: String!): Kelompok1FlightSchedule
}
```

### 4. Validasi di CreateBooking

**File**: `booking-service/index.js`

```javascript
createBooking: async (_, args, context) => {
  if (!context.userId) throw new Error("Anda harus login!");
  
  const type = args.type || 'FLIGHT';

  // Validasi flight schedule dari Kelompok 1 jika flightCode diberikan
  if (args.flightCode && type === 'FLIGHT') {
    try {
      const flightSchedule = await getKelompok1FlightSchedule(args.flightCode);
      
      // Validasi flight schedule
      if (flightSchedule.status !== 'ACTIVE') {
        throw new Error('Flight tidak aktif');
      }
      
      if (flightSchedule.availableSeats < 1) {
        throw new Error('Kursi tidak tersedia');
      }
      
      // Flight schedule valid, lanjutkan create booking
    } catch (error) {
      throw new Error(`Validasi flight schedule gagal: ${error.message}`);
    }
  }

  return await Booking.create({ 
    userId: context.userId,
    type: type,
    flightCode: args.flightCode,
    hotelName: args.hotelName,
    passengerName: args.passengerName,
    status: 'BOOKED' 
  });
}
```

## 💻 Cara Menggunakan

### Prasyarat

1. **Pastikan Kelompok 1 sudah running**:
   ```bash
   cd "C:\KAMPUS\SEMESTER 5\EAI\TUBES js v2"
   docker-compose up
   ```

2. **Pastikan Kelompok 2 sudah running**:
   ```bash
   cd "C:\KAMPUS\SEMESTER 5\IAE_TuBes-front-end"
   docker-compose up
   ```

### Step 1: Login untuk Mendapatkan Token

**Endpoint**: http://localhost:4000/graphql (Gateway Kelompok 2)

```graphql
mutation {
  login(username: "testuser", password: "password123") {
    token
    user {
      id
      username
    }
  }
}
```

### Step 2: Query Flight Schedule dari Kelompok 1

**Query**:
```graphql
query {
  kelompok1FlightSchedule(flightCode: "JMK001") {
    id
    flightCode
    departureLocation
    destinationLocation
    departureTime
    arrivalTime
    price
    availableSeats
    status
  }
}
```

**Headers**:
```json
{
  "Authorization": "Bearer <token_dari_step_1>"
}
```

**Expected Response**:
```json
{
  "data": {
    "kelompok1FlightSchedule": {
      "id": "1",
      "flightCode": "JMK001",
      "departureLocation": "Jakarta",
      "destinationLocation": "Bandung",
      "price": 500000,
      "availableSeats": 148,
      "status": "ACTIVE"
    }
  }
}
```

### Step 3: Create Booking dengan Validasi Flight Schedule

**Mutation**:
```graphql
mutation {
  createBooking(
    type: "FLIGHT"
    flightCode: "JMK001"  # Flight code dari Kelompok 1
    passengerName: "Test User"
  ) {
    id
    status
    flightCode
    passengerName
  }
}
```

**Catatan**: Booking Service akan otomatis memvalidasi flight schedule dari Kelompok 1 sebelum membuat booking.

**Expected Response**:
```json
{
  "data": {
    "createBooking": {
      "id": "1",
      "status": "BOOKED",
      "flightCode": "JMK001",
      "passengerName": "Test User"
    }
  }
}
```

## 🧪 Testing

### Test 1: Test Koneksi ke Kelompok 1

```bash
# Test dari host
curl -X POST http://localhost:4002 \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { flightByCode(flightCode: \"JMK001\") { id flightCode availableSeats status } }"
  }'
```

### Test 2: Test dari GraphQL Playground

1. Buka `http://localhost:4000/graphql` (Gateway Kelompok 2)
2. Set header: `{ "Authorization": "Bearer <token>" }`
3. Jalankan query:
```graphql
query {
  kelompok1FlightSchedule(flightCode: "JMK001") {
    id
    flightCode
    departureLocation
    destinationLocation
    price
    availableSeats
    status
  }
}
```

### Test 3: Test Create Booking dengan Validasi

```graphql
mutation {
  createBooking(
    type: "FLIGHT"
    flightCode: "JMK001"
    passengerName: "Test User"
  ) {
    id
    status
    flightCode
    passengerName
  }
}
```

## 🔧 Troubleshooting

### Error: Connection Refused

**Penyebab**: Kelompok 1 belum running atau port salah

**Solusi**:
1. Pastikan Kelompok 1 sudah running:
   ```bash
   docker-compose ps
   ```
2. Cek port 4002 sudah di-expose:
   ```bash
   # Di docker-compose.yml Kelompok 1
   ports:
     - "4002:4002"
   ```
3. Test koneksi:
   ```bash
   curl http://localhost:4002
   ```

### Error: Timeout

**Penyebab**: Service Kelompok 1 lambat merespons

**Solusi**:
1. Cek logs Kelompok 1:
   ```bash
   docker-compose logs flight-schedule-service
   ```
2. Pastikan database Kelompok 1 sudah ready
3. Cek resource server

### Error: Flight tidak ditemukan

**Penyebab**: Flight code tidak ada di Kelompok 1

**Solusi**:
1. Buat flight schedule terlebih dahulu di Kelompok 1
2. Gunakan flight code yang valid
3. Cek database Kelompok 1

### Error: Flight tidak aktif

**Penyebab**: Flight schedule status bukan 'ACTIVE'

**Solusi**:
1. Update flight schedule status menjadi 'ACTIVE' di Kelompok 1
2. Gunakan flight code yang aktif

### Error: Kursi tidak tersedia

**Penyebab**: Available seats kurang dari 1

**Solusi**:
1. Cek available seats di flight schedule
2. Gunakan flight dengan kursi tersedia

## 📝 Contoh Use Case

### Skenario 1: Melihat Flight Schedule dari Sistem Kelompok 1

**Flow**:
1. User ingin melihat jadwal penerbangan
2. Booking Service memanggil Flight Schedule Service Kelompok 1
3. Data flight schedule ditampilkan

**Query**:
```graphql
query {
  kelompok1FlightSchedule(flightCode: "JMK001") {
    flightCode
    departureLocation
    destinationLocation
    departureTime
    arrivalTime
    price
    availableSeats
  }
}
```

### Skenario 2: Membuat Booking dengan Validasi Flight Schedule

**Flow**:
1. User membuat booking dengan flightCode = "JMK001"
2. Booking Service memvalidasi flight schedule dari Kelompok 1
3. Jika valid, booking dibuat
4. Jika tidak valid, error dikembalikan

**Mutation**:
```graphql
mutation {
  createBooking(
    type: "FLIGHT"
    flightCode: "JMK001"
    passengerName: "John Doe"
  ) {
    id
    status
    passengerName
  }
}
```

## 🔐 Authentication

- **Query `flightByCode` di Kelompok 1**: Tidak memerlukan authentication
- **Query `kelompok1FlightSchedule` di Kelompok 2**: Memerlukan authentication (user-id header)
- **Mutation `createBooking`**: Memerlukan authentication

## 📊 Error Handling

Error handling sudah diimplementasikan untuk:
- Connection refused
- Timeout (5 detik)
- GraphQL errors
- Network errors
- Flight validation errors

## 🌐 Network Configuration

Menggunakan `host.docker.internal` untuk komunikasi lintas docker-compose:

- **Windows/Mac**: Otomatis tersedia
- **Linux**: Perlu menambahkan `extra_hosts`:
  ```yaml
  extra_hosts:
    - "host.docker.internal:host-gateway"
  ```

## 📚 Referensi

- Dokumentasi lengkap integrasi: `INTEGRASI_KELOMPOK2_UPDATE.md` (di folder Kelompok 1)
- Schema GraphQL Kelompok 1: Lihat dokumentasi Kelompok 1

## ✅ Checklist Integrasi

- [x] Environment variable sudah ditambahkan
- [x] Helper function sudah dibuat
- [x] GraphQL schema sudah diupdate
- [x] Resolver sudah diimplementasikan
- [x] Validasi di createBooking sudah ditambahkan
- [x] Error handling sudah ditambahkan
- [x] Timeout sudah diset (5 detik)
- [x] Package.json sudah include axios
- [x] Dokumentasi sudah lengkap

## 🔄 Alur Integrasi

```
User Request (Create Booking dengan flightCode)
    ↓
Booking Service (Kelompok 2)
    ↓
Validasi Flight Schedule dari Kelompok 1?
    ↓
Flight Schedule Service (Kelompok 1)
    ↓
Response: Flight Schedule Data
    ↓
Booking Service (Kelompok 2)
    ↓
Validasi: Status ACTIVE & Available Seats >= 1
    ↓
Create Booking
    ↓
Response: Booking Created
```

---

**Last Updated**: 2025-01-15  
**Status**: ✅ Integrated  
**Contact**: Tim Kelompok 2 (IAE_TuBes-front-end)

