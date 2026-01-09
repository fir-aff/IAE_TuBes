# 📘 Panduan Lengkap Postman & GraphQL Playground - Kelompok 2

## 📋 Daftar Isi

1. [Setup GraphQL Playground](#setup-graphql-playground)
2. [Setup Postman](#setup-postman)
3. [Collection: Membership Service](#collection-membership-service)
4. [Collection: Hotel Service](#collection-hotel-service)
5. [Collection: Booking Service](#collection-booking-service)
6. [Collection: Payment Service](#collection-payment-service)
7. [Collection: Promo Service](#collection-promo-service)
8. [Collection: Integrasi dengan Kelompok 1](#collection-integrasi-dengan-kelompok-1)
9. [Testing Flow Lengkap](#testing-flow-lengkap)
10. [Troubleshooting](#troubleshooting)

---

## 🎮 Setup GraphQL Playground

### 1. Akses GraphQL Playground

**URL**: http://localhost:4000/graphql

### 2. Set HTTP Headers

Klik **HTTP HEADERS** di bagian bawah dan tambahkan:

```json
{
  "Authorization": "Bearer <token_dari_login>"
}
```

**Catatan**: Token didapat dari mutation `login` di Membership Service.

---

## 📮 Setup Postman

### 1. Import Collection

1. Buka Postman
2. Klik **Import**
3. Pilih **Raw text** atau file JSON
4. Copy-paste collection JSON

### 2. Setup Environment Variables

Buat environment baru dengan variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | http://localhost:4000 | http://localhost:4000 |
| `token` | (kosong) | (akan diisi setelah login) |
| `user_id` | (kosong) | (akan diisi setelah login) |

---

## 👥 Collection: Membership Service

### 1. Register User

**Method**: POST  
**URL**: `{{base_url}}/graphql`

**Query**:
```graphql
mutation {
  register(
    username: "testuser"
    email: "test@example.com"
    password: "password123"
  ) {
    id
    username
    email
    role
  }
}
```

---

### 2. Login

**Method**: POST  
**URL**: `{{base_url}}/graphql`

**Query**:
```graphql
mutation {
  login(username: "testuser", password: "password123") {
    token
    user {
      id
      username
      email
    }
  }
}
```

**⚠️ Simpan token untuk request berikutnya!**

**Postman**: Set `token` variable:
```javascript
// Di Tests tab
var jsonData = pm.response.json();
pm.environment.set("token", jsonData.data.login.token);
pm.environment.set("user_id", jsonData.data.login.user.id);
```

---

## 🏨 Collection: Hotel Service

### 1. Get Hotels

**Method**: POST  
**URL**: `{{base_url}}/graphql`

**Query**:
```graphql
query {
  hotels {
    id
    name
    location
    price
    available
  }
}
```

---

### 2. Get Hotel By ID

**Method**: POST  
**URL**: `{{base_url}}/graphql`

**Query**:
```graphql
query {
  hotelById(id: "1") {
    id
    name
    location
    price
    available
  }
}
```

---

## 🎫 Collection: Booking Service

### 1. Create Booking (FLIGHT)

**Method**: POST  
**URL**: `{{base_url}}/graphql`  
**Headers**: `Authorization: Bearer {{token}}`

**Query**:
```graphql
mutation {
  createBooking(
    type: "FLIGHT"
    flightCode: "JMK001"
    passengerName: "John Doe"
  ) {
    id
    type
    flightCode
    passengerName
    status
  }
}
```

**Catatan**: Booking Service akan otomatis memvalidasi flight schedule dari Kelompok 1 jika `flightCode` diberikan.

---

### 2. Create Booking (HOTEL)

**Method**: POST  
**URL**: `{{base_url}}/graphql`  
**Headers**: `Authorization: Bearer {{token}}`

**Query**:
```graphql
mutation {
  createBooking(
    type: "HOTEL"
    hotelName: "Grand Hotel"
    passengerName: "John Doe"
  ) {
    id
    type
    hotelName
    passengerName
    status
  }
}
```

---

### 3. Get My Bookings

**Method**: POST  
**URL**: `{{base_url}}/graphql`  
**Headers**: `Authorization: Bearer {{token}}`

**Query**:
```graphql
query {
  myBookings {
    id
    type
    flightCode
    hotelName
    passengerName
    status
    createdAt
  }
}
```

---

### 4. Get Booking By ID

**Method**: POST  
**URL**: `{{base_url}}/graphql`

**Query**:
```graphql
query {
  bookingById(id: "1") {
    id
    type
    flightCode
    hotelName
    passengerName
    status
  }
}
```

**Catatan**: Query ini dapat diakses tanpa auth untuk integrasi lintas kelompok.

---

### 5. Update Booking Status

**Method**: POST  
**URL**: `{{base_url}}/graphql`  
**Headers**: `Authorization: Bearer {{token}}`

**Query**:
```graphql
mutation {
  updateBookingStatus(id: "1", status: "CANCELLED") {
    id
    status
  }
}
```

---

## 🔗 Collection: Integrasi dengan Kelompok 1

### 1. Get Flight Schedule dari Kelompok 1

**Method**: POST  
**URL**: `{{base_url}}/graphql`  
**Headers**: `Authorization: Bearer {{token}}`

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

---

### 2. Create Booking dengan Validasi Flight Schedule

**Method**: POST  
**URL**: `{{base_url}}/graphql`  
**Headers**: `Authorization: Bearer {{token}}`

**Query**:
```graphql
mutation {
  createBooking(
    type: "FLIGHT"
    flightCode: "JMK001"
    passengerName: "Test User"
  ) {
    id
    type
    flightCode
    passengerName
    status
  }
}
```

**Catatan**: 
- Booking Service akan otomatis memvalidasi flight schedule dari Kelompok 1
- Jika flight tidak aktif atau kursi tidak tersedia, error akan dikembalikan
- Jika valid, booking akan dibuat

---

## 💳 Collection: Payment Service

### 1. Create Payment

**Method**: POST  
**URL**: `{{base_url}}/graphql`  
**Headers**: `Authorization: Bearer {{token}}`

**Query**:
```graphql
mutation {
  createPayment(
    bookingId: "1"
    amount: 500000
    paymentMethod: "CREDIT_CARD"
  ) {
    id
    bookingId
    amount
    status
    paymentMethod
  }
}
```

---

### 2. Get Payments

**Method**: POST  
**URL**: `{{base_url}}/graphql`  
**Headers**: `Authorization: Bearer {{token}}`

**Query**:
```graphql
query {
  payments {
    id
    bookingId
    amount
    status
    paymentMethod
  }
}
```

---

## 🎁 Collection: Promo Service

### 1. Get Promos

**Method**: POST  
**URL**: `{{base_url}}/graphql`

**Query**:
```graphql
query {
  promos {
    id
    code
    discount
    validUntil
    active
  }
}
```

---

### 2. Get Promo By Code

**Method**: POST  
**URL**: `{{base_url}}/graphql`

**Query**:
```graphql
query {
  promoByCode(code: "DISCOUNT10") {
    id
    code
    discount
    validUntil
    active
  }
}
```

---

## 🧪 Testing Flow Lengkap

### Flow 1: Complete Booking Flow dengan Validasi Flight Schedule

#### Step 1: Register User
```graphql
mutation {
  register(
    username: "testuser"
    email: "test@example.com"
    password: "password123"
  ) {
    id
    username
  }
}
```

#### Step 2: Login
```graphql
mutation {
  login(username: "testuser", password: "password123") {
    token
    user {
      id
    }
  }
}
```

**Simpan token!**

#### Step 3: Query Flight Schedule dari Kelompok 1
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

**Prasyarat**: Pastikan Kelompok 1 sudah running dan flight schedule sudah dibuat!

#### Step 4: Create Booking dengan Validasi
```graphql
mutation {
  createBooking(
    type: "FLIGHT"
    flightCode: "JMK001"
    passengerName: "Test User"
  ) {
    id
    type
    flightCode
    passengerName
    status
  }
}
```

**Catatan**: Booking Service akan otomatis memvalidasi flight schedule dari Kelompok 1.

#### Step 5: Get My Bookings
```graphql
query {
  myBookings {
    id
    type
    flightCode
    passengerName
    status
  }
}
```

---

### Flow 2: Hotel Booking Flow

#### Step 1: Login (jika belum)

#### Step 2: Create Hotel Booking
```graphql
mutation {
  createBooking(
    type: "HOTEL"
    hotelName: "Grand Hotel"
    passengerName: "Test User"
  ) {
    id
    type
    hotelName
    passengerName
    status
  }
}
```

---

## 📋 Postman Collection JSON

### Import Collection ke Postman

```json
{
  "info": {
    "name": "IAE_TuBes - GraphQL API",
    "description": "Complete GraphQL API collection for IAE_TuBes System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:4000",
      "type": "string"
    },
    {
      "key": "token",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "1. Membership Service",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "graphql",
              "graphql": {
                "query": "mutation {\n  register(\n    username: \"testuser\"\n    email: \"test@example.com\"\n    password: \"password123\"\n  ) {\n    id\n    username\n    email\n  }\n}"
              }
            },
            "url": {
              "raw": "{{base_url}}/graphql",
              "host": ["{{base_url}}"],
              "path": ["graphql"]
            }
          }
        },
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.data && jsonData.data.login) {",
                  "    pm.environment.set(\"token\", jsonData.data.login.token);",
                  "    pm.environment.set(\"user_id\", jsonData.data.login.user.id);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "graphql",
              "graphql": {
                "query": "mutation {\n  login(username: \"testuser\", password: \"password123\") {\n    token\n    user {\n      id\n      username\n    }\n  }\n}"
              }
            },
            "url": {
              "raw": "{{base_url}}/graphql",
              "host": ["{{base_url}}"],
              "path": ["graphql"]
            }
          }
        }
      ]
    },
    {
      "name": "2. Booking Service",
      "item": [
        {
          "name": "Create Booking (FLIGHT)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "graphql",
              "graphql": {
                "query": "mutation {\n  createBooking(\n    type: \"FLIGHT\"\n    flightCode: \"JMK001\"\n    passengerName: \"John Doe\"\n  ) {\n    id\n    type\n    flightCode\n    passengerName\n    status\n  }\n}"
              }
            },
            "url": {
              "raw": "{{base_url}}/graphql",
              "host": ["{{base_url}}"],
              "path": ["graphql"]
            }
          }
        },
        {
          "name": "Get My Bookings",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "graphql",
              "graphql": {
                "query": "query {\n  myBookings {\n    id\n    type\n    flightCode\n    hotelName\n    passengerName\n    status\n  }\n}"
              }
            },
            "url": {
              "raw": "{{base_url}}/graphql",
              "host": ["{{base_url}}"],
              "path": ["graphql"]
            }
          }
        }
      ]
    },
    {
      "name": "3. Integrasi dengan Kelompok 1",
      "item": [
        {
          "name": "Get Flight Schedule dari Kelompok 1",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "graphql",
              "graphql": {
                "query": "query {\n  kelompok1FlightSchedule(flightCode: \"JMK001\") {\n    id\n    flightCode\n    departureLocation\n    destinationLocation\n    price\n    availableSeats\n    status\n  }\n}"
              }
            },
            "url": {
              "raw": "{{base_url}}/graphql",
              "host": ["{{base_url}}"],
              "path": ["graphql"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Error: Connection Refused (Kelompok 1)

**Penyebab**: Kelompok 1 belum running

**Solusi**:
1. Pastikan Kelompok 1 sudah running:
   ```bash
   cd "C:\KAMPUS\SEMESTER 5\EAI\TUBES js v2"
   docker-compose ps
   ```
2. Cek port 4002:
   ```bash
   curl http://localhost:4002
   ```

### Error: Flight tidak aktif / Kursi tidak tersedia

**Penyebab**: Validasi flight schedule gagal

**Solusi**:
1. Pastikan flight schedule ada di Kelompok 1
2. Pastikan status flight adalah `ACTIVE`
3. Pastikan available seats >= 1

---

## 📝 Tips & Best Practices

### GraphQL Playground

1. **Simpan Query**: Gunakan query history
2. **Variables**: Gunakan variables untuk query dinamis
3. **Headers**: Set header sekali di HTTP HEADERS

### Postman

1. **Environment Variables**: Gunakan untuk base_url dan token
2. **Pre-request Script**: Otomatis set token
3. **Tests**: Validasi response dan set variables

---

**Last Updated**: 2025-01-15  
**Version**: 1.0.0

