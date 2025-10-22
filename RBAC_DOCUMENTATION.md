# FoodRescue Backend - Role-Based Access Control (RBAC) Documentation

## Overview

This document describes the complete role-based access control system for the FoodRescue application. The system correctly implements three user roles with specific permissions and access controls.

## User Roles

### 1. Restaurant (`UserRole.RESTAURANT`)
**Purpose**: Manage food items and view orders

**Capabilities**:
- ✅ Create, read, update, and delete their own food items
- ✅ Mark items as for sale or free (for charity)
- ✅ Set prices and discounted prices
- ✅ Toggle item availability
- ✅ View orders placed for their items
- ✅ Update order status (pending → confirmed → completed)
- ✅ Manage their restaurant profile

**Restrictions**:
- ❌ Cannot place orders (buy or claim items)
- ❌ Can only manage their own items (ownership verification)

### 2. Customer (`UserRole.CLIENT`)
**Purpose**: Purchase food items for sale

**Capabilities**:
- ✅ View all available food items
- ✅ View items for sale (non-free items)
- ✅ Purchase items that are for sale
- ✅ View their own orders
- ✅ Cancel pending orders

**Restrictions**:
- ❌ Cannot claim free items (charity only)
- ❌ Cannot create or manage food items
- ❌ Cannot access charity-specific endpoints

### 3. Charity (`UserRole.CHARITY`)
**Purpose**: Purchase or claim free food items

**Capabilities**:
- ✅ View all available food items
- ✅ View items for sale
- ✅ View free items (marked as isFree=true)
- ✅ Purchase items for sale (same as customer)
- ✅ Claim free items at no cost
- ✅ View their own orders
- ✅ Cancel pending orders

**Restrictions**:
- ❌ Cannot create or manage food items
- ❌ Must respect item availability and quantity

---

## Data Models

### User Schema
```typescript
{
  nom: string (required)
  prenom: string (required)
  email: string (required, unique)
  password: string (required, hashed)
  role: UserRole (required) // 'restaurant' | 'client' | 'charity'
  timestamps: true
}
```

### Item Schema
```typescript
{
  name: string (required)
  description: string
  category: ItemCategory (required) // 'produit_primaire' | 'plat' | 'dessert' | 'boisson'
  quantity: number (required)
  sold: number (default: 0)
  donated: number (default: 0)
  
  // Pricing and availability
  isFree: boolean (default: false) // true = charity can claim, false = for sale
  price: number (required)
  discountedPrice: number (optional)
  isAvailable: boolean (default: true)
  
  // Pickup information
  pickupStartTime: Date
  pickupEndTime: Date
  photo: string
  
  // Ownership
  ownerId: ObjectId (ref: User, required) // Restaurant owner
  restaurantId: ObjectId (ref: Restaurant, required)
  
  lowStockThreshold: number (default: 5)
  lastUpdated: Date
  timestamps: true
}
```

### Order Schema
```typescript
{
  userId: ObjectId (ref: User, required) // Customer or Charity
  itemId: ObjectId (ref: Item, required)
  restaurantId: ObjectId (ref: Restaurant, required)
  orderType: OrderType (required) // 'purchase' | 'claim'
  quantity: number (required)
  totalPrice: number (required) // 0 for charity claims
  status: OrderStatus (default: 'pending') // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  pickupTime: Date
  notes: string
  timestamps: true
}
```

---

## API Endpoints

### Authentication (`/auth`)

All routes are public (no authentication required):

- `POST /auth/signup` - Register new user (specify role)
- `POST /auth/login` - Login and get JWT tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/change-password` - Change password (authenticated)

### Items (`/items`)

All routes require authentication.

**Restaurant Only:**
- `POST /items` - Create new item
- `GET /items/my-items` - Get my items
- `PATCH /items/:id` - Update my item
- `PATCH /items/:id/toggle-availability` - Toggle availability
- `DELETE /items/:id` - Delete my item

**All Authenticated Users:**
- `GET /items` - Get all available items
- `GET /items/:id` - Get item details
- `GET /items/restaurant/:restaurantId` - Get items by restaurant

**Customer & Charity:**
- `GET /items/for-sale` - Get items for sale

**Charity Only:**
- `GET /items/free` - Get free items

### Orders (`/orders`)

All routes require authentication.

**Customer & Charity Only:**
- `POST /orders` - Create order (buy or claim)
- `GET /orders/my-orders` - Get my orders
- `PATCH /orders/:id/cancel` - Cancel my pending order

**Restaurant Only:**
- `GET /orders/my-restaurant-orders` - Get orders for my items
- `GET /orders/restaurant/:restaurantId` - Get orders by restaurant
- `PATCH /orders/:id/status` - Update order status

**All Authenticated Users:**
- `GET /orders/:id` - Get order details (with ownership verification)

### Restaurants (`/restaurants`)

**Restaurant Only:**
- `POST /restaurants` - Create restaurant
- `PATCH /restaurants/:id` - Update restaurant
- `DELETE /restaurants/:id` - Delete restaurant
- `GET /restaurants/:id/dashboard` - Get dashboard
- `POST /restaurants/:id/stock` - Add stock item (legacy)
- `PATCH /restaurants/:id/stock/:name` - Update stock (legacy)

**All Authenticated Users:**
- `GET /restaurants` - Get all restaurants
- `GET /restaurants/:id` - Get restaurant details
- `GET /restaurants/:id/stock` - Get restaurant stock

---

## Business Logic Implementation

### Item Creation (Restaurant)
```typescript
// Restaurant creates an item
POST /items
{
  "name": "Pizza Margherita",
  "category": "plat",
  "quantity": 10,
  "price": 8.99,
  "discountedPrice": 4.99,
  "isFree": false, // For sale
  "isAvailable": true,
  "restaurantId": "restaurant_id_here"
}
```

### Customer Purchase
```typescript
// Customer buys an item
POST /orders
{
  "itemId": "item_id_here",
  "quantity": 2,
  "pickupTime": "2025-10-22T18:00:00Z"
}

// System automatically:
// - Verifies item is not free (isFree = false)
// - Creates purchase order
// - Calculates totalPrice = discountedPrice * quantity
// - Decrements item.quantity
// - Increments item.sold
```

### Charity Claim Free Item
```typescript
// Charity claims a free item
POST /orders
{
  "itemId": "free_item_id_here",
  "quantity": 5
}

// System automatically:
// - Verifies item is free (isFree = true)
// - Creates claim order with totalPrice = 0
// - Decrements item.quantity
// - Increments item.donated
```

### Charity Purchase
```typescript
// Charity can also buy items for sale
POST /orders
{
  "itemId": "item_for_sale_id",
  "quantity": 3
}

// System treats this as a regular purchase
```

### Order Status Flow
```
PENDING → CONFIRMED → COMPLETED
  ↓
CANCELLED (only if pending)
```

---

## Security & Authorization

### Guards

1. **AuthenticationGuard** (`@UseGuards(AuthenticationGuard)`)
   - Verifies JWT token
   - Extracts userId from token
   - Attaches userId to request

2. **RolesGuard** (`@UseGuards(RolesGuard)`)
   - Checks user role from database
   - Verifies role matches required roles
   - Attaches user object to request

### Decorators

1. **@Roles(...roles)** - Restrict endpoint to specific roles
   ```typescript
   @Roles(UserRole.RESTAURANT)
   @Post()
   create() { ... }
   ```

2. **@Permissions(permissions[])** - Fine-grained permission control (existing)
   ```typescript
   @Permissions([{ resource: 'items', actions: ['create', 'update'] }])
   ```

### Ownership Verification

The system verifies ownership at the service level:

```typescript
// Example: Only item owner can update
async update(id: string, updateDto: UpdateItemDto, userId: string) {
  const item = await this.itemModel.findById(id);
  if (item.ownerId.toString() !== userId) {
    throw new ForbiddenException('You can only update your own items');
  }
  // ... proceed with update
}
```

---

## Best Practices for Frontend Integration

### 1. Token Management
```typescript
// Store tokens securely
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// Include token in all requests
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

### 2. Role-Based UI
```dart
// Flutter example
if (user.role == 'restaurant') {
  // Show item management UI
} else if (user.role == 'client') {
  // Show items for sale only
} else if (user.role == 'charity') {
  // Show all items including free ones
}
```

### 3. Handle Different Order Types
```dart
// Check if user can claim free items
if (user.role == 'charity' && item.isFree) {
  // Show "Claim for Free" button
} else if (!item.isFree) {
  // Show "Buy for $X" button
}
```

### 4. Error Handling
```typescript
try {
  await api.createOrder(orderData);
} catch (error) {
  if (error.status === 403) {
    // User doesn't have permission
  } else if (error.status === 400) {
    // Business logic error (e.g., insufficient quantity)
  }
}
```

---

## Testing Examples

### Test Scenario 1: Restaurant manages items
```bash
# Login as restaurant
POST /auth/login
{ "email": "restaurant@test.com", "password": "password" }

# Create item
POST /items
Authorization: Bearer <token>
{ "name": "Croissant", "price": 2.5, "isFree": false, ... }

# View my items
GET /items/my-items
Authorization: Bearer <token>
```

### Test Scenario 2: Customer buys item
```bash
# Login as customer
POST /auth/login
{ "email": "customer@test.com", "password": "password" }

# View items for sale
GET /items/for-sale
Authorization: Bearer <token>

# Place order
POST /orders
Authorization: Bearer <token>
{ "itemId": "...", "quantity": 2 }

# Try to claim free item (should fail)
POST /orders
{ "itemId": "free_item_id", "quantity": 1 }
# Response: 403 Forbidden - "Customers cannot claim free items"
```

### Test Scenario 3: Charity claims free item
```bash
# Login as charity
POST /auth/login
{ "email": "charity@test.com", "password": "password" }

# View free items
GET /items/free
Authorization: Bearer <token>

# Claim free item
POST /orders
Authorization: Bearer <token>
{ "itemId": "free_item_id", "quantity": 5 }
# Response: Order created with totalPrice = 0, orderType = 'claim'
```

---

## Environment Setup

### Required Dependencies
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/mongoose": "^10.0.0",
  "mongoose": "^8.0.0",
  "@nestjs/jwt": "^10.0.0",
  "bcrypt": "^5.1.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### MongoDB Collections
- `users` - User accounts
- `items` - Food items
- `orders` - Purchase/claim orders
- `restaurants` - Restaurant profiles
- `refreshtokens` - JWT refresh tokens
- `resettokens` - Password reset tokens
- `roles` - Role definitions (optional)

---

## Summary of Changes Made

1. ✅ **Updated Item Schema** - Added `isFree`, `price`, `discountedPrice`, `isAvailable`, `ownerId`
2. ✅ **Updated Enums** - Added proper resources and actions
3. ✅ **Created DTOs** - Proper validation for items and orders
4. ✅ **Updated Auth Service** - Correct permissions per role
5. ✅ **Created Items Module** - Full CRUD with ownership verification
6. ✅ **Created Orders Module** - Purchase and claim logic with role validation
7. ✅ **Added Guards** - RolesGuard for role-based access control
8. ✅ **Added Decorators** - @Roles decorator for easier route protection
9. ✅ **Secured Endpoints** - All routes now have proper authentication and authorization

The system now correctly implements the business logic:
- **Restaurants** manage their items
- **Customers** can only buy items for sale
- **Charities** can buy items or claim free items
- All actions are properly validated and secured
