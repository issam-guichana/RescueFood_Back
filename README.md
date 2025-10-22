<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

**FoodRescue Backend API** - A NestJS-based backend application for managing a food rescue platform with role-based access control.

This application enables:
- 🏪 **Restaurants** to manage food items and mark them as for sale or free for charity
- 👤 **Customers** to purchase available food items
- 🤝 **Charities** to purchase or claim free food items

Built with [NestJS](https://github.com/nestjs/nest), MongoDB, and JWT authentication.

## Features

✅ **Role-Based Access Control (RBAC)**
- Restaurant, Customer, and Charity roles with distinct permissions
- Secure route protection with guards and decorators

✅ **Item Management**
- Create, update, delete food items (Restaurant only)
- Mark items as for sale or free for charity
- Toggle availability and manage inventory

✅ **Order System**
- Purchase orders for customers and charities
- Claim orders for free items (charity only)
- Order status tracking and management

✅ **Authentication & Security**
- JWT-based authentication
- Secure password hashing with bcrypt
- Token refresh mechanism
- Password reset functionality

✅ **Business Logic Enforcement**
- Customers cannot claim free items
- Charities can buy or claim free items
- Ownership verification on all operations

## Documentation

📚 **Complete documentation available:**
- [`RBAC_SUMMARY.md`](./RBAC_SUMMARY.md) - Quick overview and summary
- [`RBAC_DOCUMENTATION.md`](./RBAC_DOCUMENTATION.md) - Complete system documentation
- [`API_TESTING_GUIDE.md`](./API_TESTING_GUIDE.md) - API testing examples
- [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) - Migration and changes guide
- [`FLUTTER_INTEGRATION_GUIDE.md`](./FLUTTER_INTEGRATION_GUIDE.md) - Frontend integration

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

```bash
$ npm install
```

## Configuration

Create a `.env` file or update `src/config/config.ts` with your settings:

```env
DATABASE_URL=mongodb://localhost:27017/foodRescue
JWT_SECRET=your_secret_key_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
```

## Running the app

```bash
# development
$ npm run start

# watch mode (recommended for development)
$ npm run start:dev

# production mode
$ npm run start:prod
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Items
- `POST /items` - Create item (Restaurant)
- `GET /items` - Get all available items
- `GET /items/for-sale` - Get items for sale (Customer/Charity)
- `GET /items/free` - Get free items (Charity)
- `GET /items/my-items` - Get my items (Restaurant)
- `PATCH /items/:id` - Update item (Restaurant)
- `DELETE /items/:id` - Delete item (Restaurant)

### Orders
- `POST /orders` - Create order (Customer/Charity)
- `GET /orders/my-orders` - Get my orders
- `GET /orders/my-restaurant-orders` - Get restaurant orders (Restaurant)
- `PATCH /orders/:id/status` - Update order status (Restaurant)
- `PATCH /orders/:id/cancel` - Cancel order

### Restaurants
- `POST /restaurants` - Create restaurant (Restaurant)
- `GET /restaurants` - Get all restaurants
- `GET /restaurants/:id` - Get restaurant details
- `PATCH /restaurants/:id` - Update restaurant (Restaurant)

For complete API documentation, see [`API_TESTING_GUIDE.md`](./API_TESTING_GUIDE.md)

## Project Structure

```
src/
├── auth/                  # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── schemas/          # User, tokens schemas
├── restaurants/          # Restaurant & items management
│   ├── restaurants.controller.ts
│   ├── items.controller.ts
│   ├── items.service.ts
│   └── schemas/          # Restaurant, Item schemas
├── orders/               # Order management
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── schemas/          # Order schema
├── guards/               # Authentication & authorization guards
├── decorators/           # Custom decorators (@Roles, etc.)
└── roles/                # RBAC configuration
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Usage Examples

### 1. Register as Restaurant
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "John",
    "prenom": "Doe",
    "email": "restaurant@test.com",
    "password": "password123",
    "role": "restaurant"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "restaurant@test.com",
    "password": "password123"
  }'
```

### 3. Create Item (Restaurant)
```bash
curl -X POST http://localhost:3000/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza",
    "category": "plat",
    "quantity": 10,
    "price": 9.99,
    "isFree": false,
    "restaurantId": "RESTAURANT_ID"
  }'
```

For more examples, see [`API_TESTING_GUIDE.md`](./API_TESTING_GUIDE.md)

## Technology Stack

- **Framework:** NestJS 10.x
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** class-validator, class-transformer
- **Password Hashing:** bcrypt
- **Email:** Nodemailer

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is [MIT licensed](LICENSE).

## Support & Contact

For questions or support, please refer to the documentation files or create an issue in the repository.
