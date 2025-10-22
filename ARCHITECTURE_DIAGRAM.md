# FoodRescue System Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       FoodRescue Platform                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
          ┌─────▼────┐    ┌────▼────┐    ┌────▼─────┐
          │Restaurant│    │Customer │    │  Charity  │
          │  Role    │    │  Role   │    │   Role    │
          └──────────┘    └─────────┘    └───────────┘
```

---

## User Roles & Permissions

```
┌──────────────────────────────────────────────────────────────────┐
│                         RESTAURANT                                │
├──────────────────────────────────────────────────────────────────┤
│ Capabilities:                                                     │
│  ✓ Create/Update/Delete Items                                    │
│  ✓ Mark items as for sale or free                                │
│  ✓ Toggle item availability                                      │
│  ✓ View orders for their items                                   │
│  ✓ Update order status                                           │
│                                                                   │
│ Restrictions:                                                     │
│  ✗ Cannot place orders                                           │
│  ✗ Can only manage own items                                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                          CUSTOMER                                 │
├──────────────────────────────────────────────────────────────────┤
│ Capabilities:                                                     │
│  ✓ View items for sale                                           │
│  ✓ Purchase items (paid only)                                    │
│  ✓ View their orders                                             │
│  ✓ Cancel pending orders                                         │
│                                                                   │
│ Restrictions:                                                     │
│  ✗ Cannot claim free items                                       │
│  ✗ Cannot create/manage items                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                          CHARITY                                  │
├──────────────────────────────────────────────────────────────────┤
│ Capabilities:                                                     │
│  ✓ View all items (including free)                               │
│  ✓ Purchase items for sale                                       │
│  ✓ Claim free items (no cost)                                    │
│  ✓ View their orders                                             │
│  ✓ Cancel pending orders                                         │
│                                                                   │
│ Restrictions:                                                     │
│  ✗ Cannot create/manage items                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Item Creation Flow (Restaurant)
```
┌─────────────┐
│ Restaurant  │
│   User      │
└──────┬──────┘
       │
       │ 1. POST /items
       │    { name, price, isFree, ... }
       ▼
┌─────────────────┐
│ Items           │
│ Controller      │
└──────┬──────────┘
       │
       │ 2. Validate DTO
       │ 3. Check role = restaurant
       ▼
┌─────────────────┐
│ Items           │
│ Service         │
└──────┬──────────┘
       │
       │ 4. Set ownerId = userId
       │ 5. Save to DB
       ▼
┌─────────────────┐
│   MongoDB       │
│   Items         │
│  Collection     │
└─────────────────┘
```

### Purchase Flow (Customer)
```
┌─────────────┐
│  Customer   │
│    User     │
└──────┬──────┘
       │
       │ 1. POST /orders
       │    { itemId, quantity }
       ▼
┌─────────────────┐
│ Orders          │
│ Controller      │
└──────┬──────────┘
       │
       │ 2. Check role = client
       │ 3. Validate item exists
       ▼
┌─────────────────┐
│ Orders          │
│ Service         │
└──────┬──────────┘
       │
       │ 4. Verify item.isFree = false
       │ 5. Calculate totalPrice
       │ 6. Decrement item.quantity
       │ 7. Increment item.sold
       │ 8. Create order (type: purchase)
       ▼
┌─────────────────┐
│   MongoDB       │
│   Orders        │
│  Collection     │
└─────────────────┘
```

### Claim Flow (Charity)
```
┌─────────────┐
│   Charity   │
│    User     │
└──────┬──────┘
       │
       │ 1. POST /orders
       │    { itemId, quantity }
       ▼
┌─────────────────┐
│ Orders          │
│ Controller      │
└──────┬──────────┘
       │
       │ 2. Check role = charity
       │ 3. Validate item exists
       ▼
┌─────────────────┐
│ Orders          │
│ Service         │
└──────┬──────────┘
       │
       │ 4. Verify item.isFree = true
       │ 5. Set totalPrice = 0
       │ 6. Decrement item.quantity
       │ 7. Increment item.donated
       │ 8. Create order (type: claim)
       ▼
┌─────────────────┐
│   MongoDB       │
│   Orders        │
│  Collection     │
└─────────────────┘
```

---

## Authentication Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. POST /auth/login
     │    { email, password }
     ▼
┌─────────────────┐
│  Auth           │
│  Controller     │
└────┬────────────┘
     │
     │ 2. Validate credentials
     ▼
┌─────────────────┐
│  Auth           │
│  Service        │
└────┬────────────┘
     │
     │ 3. Hash password check
     │ 4. Generate JWT
     │ 5. Create refresh token
     ▼
┌─────────────────┐
│  Response       │
│  ─────────      │
│  accessToken    │
│  refreshToken   │
│  userId         │
│  role           │
└─────────────────┘
     │
     │ 6. Store tokens
     ▼
┌──────────┐
│  Client  │
│  Storage │
└──────────┘
```

---

## Request Authorization Flow

```
┌──────────────┐
│HTTP Request  │
│              │
│Authorization:│
│Bearer token  │
└──────┬───────┘
       │
       │ 1. Extract token
       ▼
┌─────────────────────┐
│ Authentication      │
│ Guard               │
└──────┬──────────────┘
       │
       │ 2. Verify JWT
       │ 3. Extract userId
       │ 4. Attach to request
       ▼
┌─────────────────────┐
│ Roles               │
│ Guard               │
└──────┬──────────────┘
       │
       │ 5. Get user from DB
       │ 6. Check user.role
       │ 7. Compare with @Roles()
       ▼
       │
   ┌───┴───┐
   │ Match?│
   └───┬───┘
       │
   ┌───┴────────────┐
   │                │
   YES              NO
   │                │
   ▼                ▼
┌──────────┐   ┌──────────┐
│ Allow    │   │  403     │
│ Access   │   │Forbidden │
└──────────┘   └──────────┘
```

---

## Database Schema Relationships

```
┌─────────────────────┐
│       Users         │
├─────────────────────┤
│ _id                 │◄─────────┐
│ nom                 │          │
│ prenom              │          │
│ email               │          │
│ password            │          │
│ role                │          │
└─────────────────────┘          │
                                 │
                                 │ ownerId
┌─────────────────────┐          │
│    Restaurants      │          │
├─────────────────────┤          │
│ _id                 │◄─┐       │
│ name                │  │       │
│ address             │  │       │
│ email               │  │       │
│ phone               │  │       │
└─────────────────────┘  │       │
                         │       │
                         │       │
┌─────────────────────┐  │       │
│       Items         │  │       │
├─────────────────────┤  │       │
│ _id                 │◄─┼───┐   │
│ name                │  │   │   │
│ price               │  │   │   │
│ isFree              │  │   │   │
│ quantity            │  │   │   │
│ restaurantId        │──┘   │   │
│ ownerId             │──────┘   │
└─────────────────────┘          │
         ▲                       │
         │ itemId                │
         │                       │
┌─────────────────────┐          │
│      Orders         │          │
├─────────────────────┤          │
│ _id                 │          │
│ userId              │──────────┘
│ itemId              │
│ restaurantId        │
│ orderType           │ (purchase/claim)
│ quantity            │
│ totalPrice          │
│ status              │
└─────────────────────┘
```

---

## API Endpoints Map

```
/auth
  ├── POST /signup
  ├── POST /login
  ├── POST /refresh
  ├── POST /forgot-password
  └── POST /reset-password

/items
  ├── POST /                      [Restaurant]
  ├── GET /                       [All]
  ├── GET /for-sale               [Customer, Charity]
  ├── GET /free                   [Charity]
  ├── GET /my-items               [Restaurant]
  ├── GET /:id                    [All]
  ├── PATCH /:id                  [Restaurant]
  ├── PATCH /:id/toggle-availability  [Restaurant]
  └── DELETE /:id                 [Restaurant]

/orders
  ├── POST /                      [Customer, Charity]
  ├── GET /my-orders              [Customer, Charity]
  ├── GET /my-restaurant-orders   [Restaurant]
  ├── GET /:id                    [All with verification]
  ├── PATCH /:id/status           [Restaurant]
  └── PATCH /:id/cancel           [Customer, Charity]

/restaurants
  ├── POST /                      [Restaurant]
  ├── GET /                       [All]
  ├── GET /:id                    [All]
  ├── PATCH /:id                  [Restaurant]
  └── DELETE /:id                 [Restaurant]
```

---

## Security Layers

```
┌─────────────────────────────────────────────┐
│         HTTP Request                        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Layer 1: Authentication Guard              │
│  ─────────────────────────                  │
│  ✓ Verify JWT token                         │
│  ✓ Extract user ID                          │
│  ✓ Attach to request                        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Layer 2: Roles Guard                       │
│  ─────────────────────                      │
│  ✓ Get user from database                   │
│  ✓ Check user role                          │
│  ✓ Verify against @Roles() decorator        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Layer 3: Business Logic                    │
│  ─────────────────────                      │
│  ✓ Ownership verification                   │
│  ✓ Data validation (DTOs)                   │
│  ✓ Business rules enforcement               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         Controller Action                    │
└─────────────────────────────────────────────┘
```

---

## Module Dependencies

```
┌──────────────────┐
│   App Module     │
└────────┬─────────┘
         │
    ┌────┴────────────────────────┐
    │                             │
    ▼                             ▼
┌──────────┐              ┌──────────────┐
│  Auth    │              │ Restaurants  │
│  Module  │              │   Module     │
└────┬─────┘              └──────┬───────┘
     │                           │
     │ exports User model        │
     │                           │
     │                      ┌────┴─────┐
     │                      │          │
     │                      ▼          ▼
     │              ┌───────────┐  ┌──────────┐
     │              │  Items    │  │Restaurant│
     │              │Controller │  │Controller│
     │              └─────┬─────┘  └──────────┘
     │                    │
     │                    ▼
     │              ┌───────────┐
     │              │  Items    │
     │              │ Service   │
     │              └───────────┘
     │
     ▼
┌──────────────┐
│   Orders     │
│   Module     │
└──────┬───────┘
       │
   ┌───┴────┐
   │        │
   ▼        ▼
┌──────┐ ┌──────┐
│Orders│ │Orders│
│Ctrl  │ │Service│
└──────┘ └──────┘
```

---

## Key Design Patterns

### 1. Repository Pattern
```
Controller → Service → Model → Database
```

### 2. Guard Pattern
```
Request → AuthGuard → RolesGuard → Controller
```

### 3. DTO Pattern
```
Request Body → DTO → Validation → Service
```

### 4. Ownership Verification
```
Service Method → Check ownerId === userId → Allow/Deny
```

---

## Business Rules Summary

| Actor      | Can Create Items | Can Buy Items | Can Claim Free | Can Manage Items |
|------------|------------------|---------------|----------------|------------------|
| Restaurant | ✅ Yes           | ❌ No         | ❌ No          | ✅ Yes (own)     |
| Customer   | ❌ No            | ✅ Yes (paid) | ❌ No          | ❌ No            |
| Charity    | ❌ No            | ✅ Yes (paid) | ✅ Yes (free)  | ❌ No            |

---

This architecture ensures:
- ✅ **Security**: Multiple layers of authentication and authorization
- ✅ **Scalability**: Clean module separation
- ✅ **Maintainability**: Clear responsibilities and patterns
- ✅ **Business Logic**: Correctly enforced rules
- ✅ **Type Safety**: DTOs and models with validation
