# Migration Guide - RBAC System Update

This guide explains what changed in the FoodRescue backend and how to use the new system.

## What Changed?

### 1. **Item Schema Enhanced** ✅
**File:** `src/restaurants/schemas/item.schema.ts`

**New Fields:**
- `description: string` - Item description
- `isFree: boolean` - Whether item is free for charity (default: false)
- `price: number` - Required price field
- `discountedPrice: number` - Optional discounted price
- `isAvailable: boolean` - Restaurant can toggle availability
- `ownerId: ObjectId` - Reference to the user (restaurant) who created it

**Why:** To properly distinguish between items for sale and free items for charity.

---

### 2. **New Enums** ✅
**File:** `src/roles/enums/action.enum.ts` & `resource.enum.ts`

**Actions Added:**
- `buy` - For customers to purchase items
- `claim` - For charities to claim free items
- `manage` - For restaurants to manage items

**Resources Updated:**
- `items` - Food items/products
- `orders` - Purchase/claim orders
- `restaurants` - Restaurant management

**Why:** To support the new business logic properly.

---

### 3. **New DTOs Created** ✅
**Files:** 
- `src/restaurants/dto/create-item.dto.ts`
- `src/restaurants/dto/update-item.dto.ts`

**New DTO: CreateItemDto**
```typescript
{
  name: string;
  description?: string;
  category: ItemCategory;
  quantity: number;
  price: number; // Required
  discountedPrice?: number;
  isFree?: boolean; // Mark as free for charity
  isAvailable?: boolean;
  pickupStartTime?: Date;
  pickupEndTime?: Date;
  photo?: string;
  restaurantId: string;
}
```

**Why:** Proper validation and type safety for the new item structure.

---

### 4. **New Items Module** ✅
**Files:**
- `src/restaurants/items.controller.ts` - NEW
- `src/restaurants/items.service.ts` - NEW

**Purpose:** Dedicated controller and service for item management with proper role-based access control.

**Key Features:**
- Restaurants can CRUD their own items
- Customers can view items for sale
- Charities can view all items including free ones
- Ownership verification on all update/delete operations

---

### 5. **New Orders Module** ✅
**Files:**
- `src/orders/orders.controller.ts` - NEW
- `src/orders/orders.service.ts` - NEW
- `src/orders/schemas/order.schema.ts` - NEW
- `src/orders/dto/create-order.dto.ts` - NEW

**Purpose:** Handle purchases and claims with proper business logic.

**Order Types:**
- `PURCHASE` - Customer or Charity buys item (with price)
- `CLAIM` - Charity claims free item (price = 0)

**Order Statuses:**
- `PENDING` - Just created
- `CONFIRMED` - Restaurant confirmed
- `COMPLETED` - Order fulfilled
- `CANCELLED` - Cancelled by user or restaurant

**Key Logic:**
- Customers can only buy items (`isFree: false`)
- Charities can buy items OR claim free items (`isFree: true`)
- Quantity is automatically updated on order creation
- Orders track `sold` and `donated` separately

---

### 6. **New Guards and Decorators** ✅
**Files:**
- `src/guards/roles.guard.ts` - NEW
- `src/decorators/roles.decorator.ts` - NEW

**RolesGuard:**
```typescript
@UseGuards(AuthenticationGuard, RolesGuard)
@Roles(UserRole.RESTAURANT)
```

**Why:** Simpler and cleaner role-based access control compared to the complex permission system.

---

### 7. **Updated Auth Service** ✅
**File:** `src/auth/auth.service.ts`

**Updated `getUserPermissions()` method:**
```typescript
switch (user.role) {
  case UserRole.RESTAURANT:
    return [
      { resource: 'items', actions: ['create', 'read', 'update', 'delete', 'manage'] },
      { resource: 'restaurants', actions: ['read', 'update'] }
    ];
  case UserRole.CLIENT:
    return [
      { resource: 'items', actions: ['read'] },
      { resource: 'orders', actions: ['create', 'read', 'buy'] }
    ];
  case UserRole.CHARITY:
    return [
      { resource: 'items', actions: ['read'] },
      { resource: 'orders', actions: ['create', 'read', 'buy', 'claim'] }
    ];
}
```

**Why:** Permissions now match the actual business requirements.

---

### 8. **Updated Restaurant Controller** ✅
**File:** `src/restaurants/restaurants.controller.ts`

**Changes:**
- Added authentication and role guards to all endpoints
- Added proper role decorators (`@Roles(UserRole.RESTAURANT)`)
- Added comments documenting what each endpoint does

**Why:** Secure all endpoints and make them self-documenting.

---

### 9. **Module Updates** ✅
**Files:**
- `src/restaurants/restaurants.module.ts` - Added Items controller/service
- `src/app.module.ts` - Added OrdersModule
- `src/auth/auth.module.ts` - Export MongooseModule for User model

**Why:** Properly wire up all the new components.

---

## API Changes

### Old System (Before)
```
Items were part of Restaurant stock
No distinction between free and paid items
No proper order tracking
Permissions were generic and not role-specific
```

### New System (After)
```
Items are separate entities with ownership
Clear distinction: isFree flag
Proper order system with purchase/claim logic
Role-based permissions that match business logic
```

---

## Breaking Changes

### 1. Item Creation
**Before:**
```typescript
POST /restaurants/:id/stock
{
  "name": "Pizza",
  "originalPrice": 10,
  "quantity": 5
}
```

**After (New):**
```typescript
POST /items
{
  "name": "Pizza",
  "category": "plat",
  "price": 10,
  "isFree": false,
  "quantity": 5,
  "restaurantId": "restaurant_id"
}
```

### 2. Viewing Items
**Before:**
```typescript
GET /restaurants/:id/stock
```

**After (New):**
```typescript
GET /items                    // All items
GET /items/for-sale          // For customers
GET /items/free              // For charities
GET /items/my-items          // Restaurant's own items
```

### 3. Ordering (NEW)
```typescript
POST /orders
{
  "itemId": "item_id",
  "quantity": 2
}
```

The system automatically determines if it's a purchase or claim based on:
- User role (customer vs charity)
- Item's `isFree` flag

---

## Migration Steps for Existing Data

If you have existing data, you'll need to migrate it:

### Step 1: Update existing items
```javascript
// MongoDB shell or migration script
db.items.updateMany(
  {},
  {
    $set: {
      isFree: false,
      isAvailable: true,
      price: 0 // Update with actual prices
    }
  }
)
```

### Step 2: Add ownerId to items
```javascript
// For each item, set ownerId based on restaurantId
// You'll need to map restaurants to their owner users
```

### Step 3: Update users
```javascript
// Ensure all users have proper roles
db.users.updateMany(
  { role: "CLIENT" },
  { $set: { role: "client" } }
)
```

---

## How to Use the New System

### As a Restaurant:

**1. Create your restaurant:**
```http
POST /restaurants
{
  "name": "My Restaurant",
  "address": "123 Street",
  "email": "contact@resto.com",
  "phone": "+1234567890"
}
```

**2. Create items:**
```http
POST /items
{
  "name": "Burger",
  "category": "plat",
  "quantity": 20,
  "price": 8.99,
  "discountedPrice": 4.99,
  "isFree": false,
  "restaurantId": "your_restaurant_id"
}
```

**3. Mark some items as free for charity:**
```http
POST /items
{
  "name": "Day-old bread",
  "category": "produit_primaire",
  "quantity": 30,
  "price": 2.00,
  "isFree": true,
  "restaurantId": "your_restaurant_id"
}
```

**4. View orders for your items:**
```http
GET /orders/my-restaurant-orders
```

**5. Update order status:**
```http
PATCH /orders/:orderId/status
{ "status": "confirmed" }
```

---

### As a Customer:

**1. View items for sale:**
```http
GET /items/for-sale
```

**2. Place an order:**
```http
POST /orders
{
  "itemId": "item_id",
  "quantity": 2
}
```

**3. View your orders:**
```http
GET /orders/my-orders
```

**4. Cancel pending order:**
```http
PATCH /orders/:orderId/cancel
```

---

### As a Charity:

**1. View all available items:**
```http
GET /items
```

**2. View only free items:**
```http
GET /items/free
```

**3. Claim free item:**
```http
POST /orders
{
  "itemId": "free_item_id",
  "quantity": 5
}
```

**4. Or purchase regular item:**
```http
POST /orders
{
  "itemId": "paid_item_id",
  "quantity": 2
}
```

---

## Testing the New System

### 1. Test Restaurant Flow
```bash
# Register
POST /auth/signup { "role": "restaurant", ... }

# Login
POST /auth/login { ... }

# Create restaurant
POST /restaurants { ... }

# Create items
POST /items { "isFree": false, ... }
POST /items { "isFree": true, ... }

# View my items
GET /items/my-items

# View orders
GET /orders/my-restaurant-orders
```

### 2. Test Customer Flow
```bash
# Register & Login
POST /auth/signup { "role": "client", ... }
POST /auth/login { ... }

# View items
GET /items/for-sale

# Try to access free items (should fail)
GET /items/free  # 403 Forbidden

# Create order
POST /orders { "itemId": "paid_item", ... }

# Try to claim free item (should fail)
POST /orders { "itemId": "free_item", ... }  # 403 Forbidden
```

### 3. Test Charity Flow
```bash
# Register & Login
POST /auth/signup { "role": "charity", ... }
POST /auth/login { ... }

# View all items
GET /items

# View free items
GET /items/free

# Claim free item (totalPrice = 0)
POST /orders { "itemId": "free_item", ... }

# Buy paid item (with price)
POST /orders { "itemId": "paid_item", ... }
```

---

## Backward Compatibility

The old endpoints are still available for backward compatibility:
- `POST /restaurants/:id/stock`
- `PATCH /restaurants/:id/stock/:name`
- `GET /restaurants/:id/stock`

**However, it's recommended to migrate to the new `/items` endpoints.**

---

## Summary

✅ **Better Role Separation** - Each role has clear, distinct capabilities
✅ **Proper Business Logic** - Customers can't claim free items, charities can
✅ **Ownership Verification** - Restaurants can only manage their own items
✅ **Order Tracking** - Complete order lifecycle with status management
✅ **Secure by Default** - All endpoints protected with authentication and authorization
✅ **Type Safety** - Proper DTOs with validation
✅ **Scalable** - Clean separation of concerns

The system is now ready for production and frontend integration!
