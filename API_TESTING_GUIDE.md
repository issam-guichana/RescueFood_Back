# FoodRescue API Testing Guide

This guide provides complete examples for testing all API endpoints using tools like Postman, Insomnia, or cURL.

## Base URL
```
http://localhost:3000
```

---

## 1. Authentication Endpoints

### 1.1 Register New User
```http
POST /auth/signup
Content-Type: application/json

{
  "nom": "John",
  "prenom": "Doe",
  "email": "john@restaurant.com",
  "password": "SecurePass123",
  "role": "restaurant"
}
```

**Possible roles:** `"restaurant"`, `"client"`, `"charity"`

**Response:**
```json
{
  "_id": "user_id_here",
  "nom": "John",
  "prenom": "Doe",
  "email": "john@restaurant.com",
  "role": "restaurant"
}
```

### 1.2 Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@restaurant.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "userId": "user_id_here",
  "role": "restaurant",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid-v4-token-here"
}
```

### 1.3 Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "uuid-v4-token-here"
}
```

---

## 2. Item Endpoints (Restaurants)

### 2.1 Create Item (Restaurant Only)
```http
POST /items
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Pizza Margherita",
  "description": "Classic Italian pizza with tomato and mozzarella",
  "category": "plat",
  "quantity": 15,
  "price": 12.99,
  "discountedPrice": 6.99,
  "isFree": false,
  "isAvailable": true,
  "pickupStartTime": "2025-10-22T17:00:00Z",
  "pickupEndTime": "2025-10-22T21:00:00Z",
  "restaurantId": "restaurant_object_id_here",
  "photo": "https://example.com/pizza.jpg"
}
```

**Categories:** `"produit_primaire"`, `"plat"`, `"dessert"`, `"boisson"`

### 2.2 Create Free Item for Charity
```http
POST /items
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Surplus Bread",
  "description": "Fresh bread from today",
  "category": "produit_primaire",
  "quantity": 20,
  "price": 3.00,
  "isFree": true,
  "isAvailable": true,
  "restaurantId": "restaurant_object_id_here"
}
```

### 2.3 Get My Items (Restaurant Only)
```http
GET /items/my-items
Authorization: Bearer <accessToken>
```

### 2.4 Update Item (Restaurant Only)
```http
PATCH /items/:itemId
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "quantity": 10,
  "discountedPrice": 4.99,
  "isAvailable": true
}
```

### 2.5 Toggle Item Availability
```http
PATCH /items/:itemId/toggle-availability
Authorization: Bearer <accessToken>
```

### 2.6 Delete Item (Restaurant Only)
```http
DELETE /items/:itemId
Authorization: Bearer <accessToken>
```

---

## 3. Item Endpoints (All Users)

### 3.1 Get All Available Items
```http
GET /items
Authorization: Bearer <accessToken>
```

### 3.2 Get Items For Sale (Customer & Charity)
```http
GET /items/for-sale
Authorization: Bearer <accessToken>
```

**Returns only items where `isFree: false`**

### 3.3 Get Free Items (Charity Only)
```http
GET /items/free
Authorization: Bearer <accessToken>
```

**Returns only items where `isFree: true`**

### 3.4 Get Items by Restaurant
```http
GET /items/restaurant/:restaurantId
Authorization: Bearer <accessToken>
```

### 3.5 Get Single Item
```http
GET /items/:itemId
Authorization: Bearer <accessToken>
```

---

## 4. Order Endpoints

### 4.1 Create Order - Customer Purchase
```http
POST /orders
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "itemId": "item_object_id_here",
  "quantity": 2,
  "pickupTime": "2025-10-22T18:30:00Z",
  "notes": "Please pack separately"
}
```

**For Customer:** Will create a PURCHASE order with calculated price.
**Validation:** Item must NOT be free (`isFree: false`)

### 4.2 Create Order - Charity Claim Free Item
```http
POST /orders
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "itemId": "free_item_id_here",
  "quantity": 5,
  "pickupTime": "2025-10-22T19:00:00Z"
}
```

**For Charity:** Will create a CLAIM order with `totalPrice: 0`
**Validation:** Item must be free (`isFree: true`)

### 4.3 Get My Orders (Customer & Charity)
```http
GET /orders/my-orders
Authorization: Bearer <accessToken>
```

### 4.4 Get Restaurant Orders (Restaurant Only)
```http
GET /orders/my-restaurant-orders
Authorization: Bearer <accessToken>
```

Returns all orders for items owned by this restaurant.

### 4.5 Get Single Order
```http
GET /orders/:orderId
Authorization: Bearer <accessToken>
```

**Access Control:**
- Customers/Charities can only see their own orders
- Restaurants can see orders for their items

### 4.6 Update Order Status (Restaurant Only)
```http
PATCH /orders/:orderId/status
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Valid statuses:** `"pending"`, `"confirmed"`, `"completed"`, `"cancelled"`

### 4.7 Cancel Order (Customer & Charity)
```http
PATCH /orders/:orderId/cancel
Authorization: Bearer <accessToken>
```

**Note:** Only PENDING orders can be cancelled. Cancelled orders restore item quantity.

---

## 5. Restaurant Endpoints

### 5.1 Create Restaurant (Restaurant Only)
```http
POST /restaurants
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "La Bella Pizzeria",
  "address": "123 Main Street, Paris",
  "email": "contact@labellapizza.com",
  "phone": "+33 1 23 45 67 89",
  "categories": ["Plats", "Desserts", "Boissons"]
}
```

### 5.2 Get All Restaurants (All Users)
```http
GET /restaurants
Authorization: Bearer <accessToken>
```

### 5.3 Get Single Restaurant (All Users)
```http
GET /restaurants/:restaurantId
Authorization: Bearer <accessToken>
```

### 5.4 Update Restaurant (Restaurant Only)
```http
PATCH /restaurants/:restaurantId
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "phone": "+33 1 98 76 54 32",
  "categories": ["Plats", "Desserts", "Boissons", "Patisserie"]
}
```

### 5.5 Get Restaurant Dashboard (Restaurant Only)
```http
GET /restaurants/:restaurantId/dashboard
Authorization: Bearer <accessToken>
```

Returns stock information with low stock alerts.

---

## 6. Complete Testing Scenarios

### Scenario A: Restaurant Creates and Manages Items

**Step 1:** Register as restaurant
```http
POST /auth/signup
{
  "nom": "Restaurant",
  "prenom": "Owner",
  "email": "owner@resto.com",
  "password": "password123",
  "role": "restaurant"
}
```

**Step 2:** Login
```http
POST /auth/login
{
  "email": "owner@resto.com",
  "password": "password123"
}
```
*Save the accessToken*

**Step 3:** Create restaurant
```http
POST /restaurants
Authorization: Bearer <accessToken>
{
  "name": "My Restaurant",
  "address": "123 Street",
  "email": "contact@resto.com",
  "phone": "+1234567890"
}
```
*Save the restaurant _id*

**Step 4:** Create item for sale
```http
POST /items
Authorization: Bearer <accessToken>
{
  "name": "Burger",
  "category": "plat",
  "quantity": 20,
  "price": 8.99,
  "isFree": false,
  "restaurantId": "<restaurant_id>"
}
```

**Step 5:** Create free item for charity
```http
POST /items
Authorization: Bearer <accessToken>
{
  "name": "Day-old bread",
  "category": "produit_primaire",
  "quantity": 30,
  "price": 2.00,
  "isFree": true,
  "restaurantId": "<restaurant_id>"
}
```

**Step 6:** View my items
```http
GET /items/my-items
Authorization: Bearer <accessToken>
```

---

### Scenario B: Customer Purchases Item

**Step 1:** Register as customer
```http
POST /auth/signup
{
  "nom": "Alice",
  "prenom": "Customer",
  "email": "alice@customer.com",
  "password": "password123",
  "role": "client"
}
```

**Step 2:** Login
```http
POST /auth/login
{
  "email": "alice@customer.com",
  "password": "password123"
}
```

**Step 3:** View items for sale
```http
GET /items/for-sale
Authorization: Bearer <accessToken>
```

**Step 4:** Purchase item
```http
POST /orders
Authorization: Bearer <accessToken>
{
  "itemId": "<burger_item_id>",
  "quantity": 2
}
```

**Step 5:** View my orders
```http
GET /orders/my-orders
Authorization: Bearer <accessToken>
```

**Step 6:** Try to claim free item (should fail)
```http
POST /orders
Authorization: Bearer <accessToken>
{
  "itemId": "<free_bread_item_id>",
  "quantity": 1
}
```
*Expected: 403 Forbidden - "Customers cannot claim free items"*

---

### Scenario C: Charity Claims Free Item

**Step 1:** Register as charity
```http
POST /auth/signup
{
  "nom": "Food",
  "prenom": "Bank",
  "email": "charity@foodbank.org",
  "password": "password123",
  "role": "charity"
}
```

**Step 2:** Login
```http
POST /auth/login
{
  "email": "charity@foodbank.org",
  "password": "password123"
}
```

**Step 3:** View free items
```http
GET /items/free
Authorization: Bearer <accessToken>
```

**Step 4:** Claim free item
```http
POST /orders
Authorization: Bearer <accessToken>
{
  "itemId": "<free_bread_item_id>",
  "quantity": 10
}
```
*Expected: Order created with totalPrice: 0, orderType: "claim"*

**Step 5:** Also purchase a paid item
```http
POST /orders
Authorization: Bearer <accessToken>
{
  "itemId": "<burger_item_id>",
  "quantity": 3
}
```
*Expected: Order created with calculated price, orderType: "purchase"*

---

## 7. Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Insufficient quantity available",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You can only update your own items",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Item not found",
  "error": "Not Found"
}
```

---

## 8. Postman Collection Structure

Create a Postman collection with these folders:

```
FoodRescue API
├── Auth
│   ├── Signup (Restaurant)
│   ├── Signup (Customer)
│   ├── Signup (Charity)
│   ├── Login
│   └── Refresh Token
├── Items (Restaurant)
│   ├── Create Item (For Sale)
│   ├── Create Item (Free)
│   ├── Get My Items
│   ├── Update Item
│   ├── Toggle Availability
│   └── Delete Item
├── Items (Viewing)
│   ├── Get All Items
│   ├── Get For Sale
│   ├── Get Free Items
│   ├── Get by Restaurant
│   └── Get Single Item
├── Orders (Customer/Charity)
│   ├── Create Purchase Order
│   ├── Create Claim Order
│   ├── Get My Orders
│   ├── Get Single Order
│   └── Cancel Order
├── Orders (Restaurant)
│   ├── Get My Restaurant Orders
│   └── Update Order Status
└── Restaurants
    ├── Create Restaurant
    ├── Get All Restaurants
    ├── Get Single Restaurant
    ├── Update Restaurant
    └── Get Dashboard
```

### Environment Variables
```json
{
  "baseUrl": "http://localhost:3000",
  "accessToken": "",
  "refreshToken": "",
  "restaurantId": "",
  "itemId": "",
  "orderId": ""
}
```

---

## 9. cURL Examples

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### Create Item
```bash
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Pizza",
    "category": "plat",
    "quantity": 10,
    "price": 9.99,
    "isFree": false,
    "restaurantId": "RESTAURANT_ID"
  }'
```

### Get Items
```bash
curl -X GET http://localhost:3000/items \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Order
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "itemId": "ITEM_ID",
    "quantity": 2
  }'
```

---

## 10. Quick Test Commands

Save these as scripts for quick testing:

**test-restaurant.sh**
```bash
#!/bin/bash
TOKEN="your_restaurant_token_here"
API="http://localhost:3000"

# Create item
curl -X POST $API/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","category":"plat","quantity":5,"price":10,"isFree":false,"restaurantId":"YOUR_RESTO_ID"}'

# Get my items
curl -X GET $API/items/my-items \
  -H "Authorization: Bearer $TOKEN"
```

**test-customer.sh**
```bash
#!/bin/bash
TOKEN="your_customer_token_here"
API="http://localhost:3000"

# View items for sale
curl -X GET $API/items/for-sale \
  -H "Authorization: Bearer $TOKEN"

# Create order
curl -X POST $API/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"itemId":"ITEM_ID","quantity":1}'
```

---

## Summary

- All authenticated endpoints require `Authorization: Bearer <token>` header
- Restaurant users can manage items and view orders
- Customers can only buy items for sale
- Charities can buy items or claim free items
- All routes have proper role-based access control
- Ownership is verified at the service level for security
