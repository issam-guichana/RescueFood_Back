# Flutter Frontend Integration Guide

This guide shows how to integrate your Flutter app with the FoodRescue backend API.

## Table of Contents
1. [Setup](#setup)
2. [Authentication](#authentication)
3. [API Service](#api-service)
4. [Data Models](#data-models)
5. [UI Examples](#ui-examples)
6. [Best Practices](#best-practices)

---

## Setup

### Dependencies (pubspec.yaml)
```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  provider: ^6.1.0
  shared_preferences: ^2.2.0
  flutter_secure_storage: ^9.0.0
```

### API Configuration
```dart
// lib/config/api_config.dart
class ApiConfig {
  static const String baseUrl = 'http://localhost:3000'; // Development
  // static const String baseUrl = 'https://api.foodrescue.com'; // Production
  
  static const String authEndpoint = '/auth';
  static const String itemsEndpoint = '/items';
  static const String ordersEndpoint = '/orders';
  static const String restaurantsEndpoint = '/restaurants';
}
```

---

## Authentication

### Auth Service
```dart
// lib/services/auth_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';
import '../models/user.dart';

class AuthService {
  final storage = const FlutterSecureStorage();
  
  // Sign up
  Future<User> signup({
    required String nom,
    required String prenom,
    required String email,
    required String password,
    required String role, // 'restaurant', 'client', 'charity'
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.authEndpoint}/signup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'nom': nom,
        'prenom': prenom,
        'email': email,
        'password': password,
        'role': role,
      }),
    );

    if (response.statusCode == 201) {
      return User.fromJson(jsonDecode(response.body));
    } else {
      throw Exception(jsonDecode(response.body)['message']);
    }
  }

  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.authEndpoint}/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      
      // Store tokens securely
      await storage.write(key: 'accessToken', value: data['accessToken']);
      await storage.write(key: 'refreshToken', value: data['refreshToken']);
      await storage.write(key: 'userId', value: data['userId']);
      await storage.write(key: 'userRole', value: data['role']);
      
      return data;
    } else {
      throw Exception(jsonDecode(response.body)['message']);
    }
  }

  // Get stored token
  Future<String?> getAccessToken() async {
    return await storage.read(key: 'accessToken');
  }

  // Get user role
  Future<String?> getUserRole() async {
    return await storage.read(key: 'userRole');
  }

  // Logout
  Future<void> logout() async {
    await storage.deleteAll();
  }

  // Check if logged in
  Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null;
  }
}
```

---

## API Service

### Base API Service with Auth Header
```dart
// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'auth_service.dart';

class ApiService {
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // Generic GET request
  Future<dynamic> get(String endpoint) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Request failed');
    }
  }

  // Generic POST request
  Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: headers,
      body: jsonEncode(body),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Request failed');
    }
  }

  // Generic PATCH request
  Future<dynamic> patch(String endpoint, Map<String, dynamic> body) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: headers,
      body: jsonEncode(body),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Request failed');
    }
  }

  // Generic DELETE request
  Future<dynamic> delete(String endpoint) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Request failed');
    }
  }
}
```

### Items Service
```dart
// lib/services/items_service.dart
import 'api_service.dart';
import '../models/item.dart';
import '../config/api_config.dart';

class ItemsService {
  final ApiService _api = ApiService();

  // Get all available items
  Future<List<Item>> getAllItems() async {
    final data = await _api.get(ApiConfig.itemsEndpoint);
    return (data as List).map((json) => Item.fromJson(json)).toList();
  }

  // Get items for sale (Customer view)
  Future<List<Item>> getItemsForSale() async {
    final data = await _api.get('${ApiConfig.itemsEndpoint}/for-sale');
    return (data as List).map((json) => Item.fromJson(json)).toList();
  }

  // Get free items (Charity view)
  Future<List<Item>> getFreeItems() async {
    final data = await _api.get('${ApiConfig.itemsEndpoint}/free');
    return (data as List).map((json) => Item.fromJson(json)).toList();
  }

  // Get my items (Restaurant)
  Future<List<Item>> getMyItems() async {
    final data = await _api.get('${ApiConfig.itemsEndpoint}/my-items');
    return (data as List).map((json) => Item.fromJson(json)).toList();
  }

  // Create item (Restaurant)
  Future<Item> createItem(Map<String, dynamic> itemData) async {
    final data = await _api.post(ApiConfig.itemsEndpoint, itemData);
    return Item.fromJson(data);
  }

  // Update item (Restaurant)
  Future<Item> updateItem(String itemId, Map<String, dynamic> itemData) async {
    final data = await _api.patch('${ApiConfig.itemsEndpoint}/$itemId', itemData);
    return Item.fromJson(data);
  }

  // Delete item (Restaurant)
  Future<void> deleteItem(String itemId) async {
    await _api.delete('${ApiConfig.itemsEndpoint}/$itemId');
  }

  // Toggle availability (Restaurant)
  Future<Item> toggleAvailability(String itemId) async {
    final data = await _api.patch(
      '${ApiConfig.itemsEndpoint}/$itemId/toggle-availability',
      {},
    );
    return Item.fromJson(data);
  }
}
```

### Orders Service
```dart
// lib/services/orders_service.dart
import 'api_service.dart';
import '../models/order.dart';
import '../config/api_config.dart';

class OrdersService {
  final ApiService _api = ApiService();

  // Create order (Customer/Charity)
  Future<Order> createOrder({
    required String itemId,
    required int quantity,
    DateTime? pickupTime,
    String? notes,
  }) async {
    final data = await _api.post(ApiConfig.ordersEndpoint, {
      'itemId': itemId,
      'quantity': quantity,
      if (pickupTime != null) 'pickupTime': pickupTime.toIso8601String(),
      if (notes != null) 'notes': notes,
    });
    return Order.fromJson(data);
  }

  // Get my orders (Customer/Charity)
  Future<List<Order>> getMyOrders() async {
    final data = await _api.get('${ApiConfig.ordersEndpoint}/my-orders');
    return (data as List).map((json) => Order.fromJson(json)).toList();
  }

  // Get restaurant orders (Restaurant)
  Future<List<Order>> getRestaurantOrders() async {
    final data = await _api.get('${ApiConfig.ordersEndpoint}/my-restaurant-orders');
    return (data as List).map((json) => Order.fromJson(json)).toList();
  }

  // Update order status (Restaurant)
  Future<Order> updateOrderStatus(String orderId, String status) async {
    final data = await _api.patch(
      '${ApiConfig.ordersEndpoint}/$orderId/status',
      {'status': status},
    );
    return Order.fromJson(data);
  }

  // Cancel order (Customer/Charity)
  Future<Order> cancelOrder(String orderId) async {
    final data = await _api.patch(
      '${ApiConfig.ordersEndpoint}/$orderId/cancel',
      {},
    );
    return Order.fromJson(data);
  }
}
```

---

## Data Models

### User Model
```dart
// lib/models/user.dart
class User {
  final String id;
  final String nom;
  final String prenom;
  final String email;
  final String role; // 'restaurant', 'client', 'charity'

  User({
    required this.id,
    required this.nom,
    required this.prenom,
    required this.email,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? '',
      nom: json['nom'] ?? '',
      prenom: json['prenom'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
    );
  }

  bool get isRestaurant => role == 'restaurant';
  bool get isCustomer => role == 'client';
  bool get isCharity => role == 'charity';
}
```

### Item Model
```dart
// lib/models/item.dart
class Item {
  final String id;
  final String name;
  final String? description;
  final String category;
  final int quantity;
  final double price;
  final double? discountedPrice;
  final bool isFree;
  final bool isAvailable;
  final DateTime? pickupStartTime;
  final DateTime? pickupEndTime;
  final String? photo;
  final String restaurantId;

  Item({
    required this.id,
    required this.name,
    this.description,
    required this.category,
    required this.quantity,
    required this.price,
    this.discountedPrice,
    required this.isFree,
    required this.isAvailable,
    this.pickupStartTime,
    this.pickupEndTime,
    this.photo,
    required this.restaurantId,
  });

  factory Item.fromJson(Map<String, dynamic> json) {
    return Item(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      category: json['category'] ?? '',
      quantity: json['quantity'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
      discountedPrice: json['discountedPrice']?.toDouble(),
      isFree: json['isFree'] ?? false,
      isAvailable: json['isAvailable'] ?? true,
      pickupStartTime: json['pickupStartTime'] != null 
          ? DateTime.parse(json['pickupStartTime']) 
          : null,
      pickupEndTime: json['pickupEndTime'] != null 
          ? DateTime.parse(json['pickupEndTime']) 
          : null,
      photo: json['photo'],
      restaurantId: json['restaurantId'] ?? '',
    );
  }

  double get displayPrice => discountedPrice ?? price;
  bool get hasDiscount => discountedPrice != null && discountedPrice! < price;
}
```

### Order Model
```dart
// lib/models/order.dart
class Order {
  final String id;
  final String userId;
  final String itemId;
  final String restaurantId;
  final String orderType; // 'purchase' or 'claim'
  final int quantity;
  final double totalPrice;
  final String status; // 'pending', 'confirmed', 'completed', 'cancelled'
  final DateTime? pickupTime;
  final String? notes;
  final DateTime createdAt;

  Order({
    required this.id,
    required this.userId,
    required this.itemId,
    required this.restaurantId,
    required this.orderType,
    required this.quantity,
    required this.totalPrice,
    required this.status,
    this.pickupTime,
    this.notes,
    required this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['_id'] ?? '',
      userId: json['userId'] ?? '',
      itemId: json['itemId'] ?? '',
      restaurantId: json['restaurantId'] ?? '',
      orderType: json['orderType'] ?? '',
      quantity: json['quantity'] ?? 0,
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      status: json['status'] ?? '',
      pickupTime: json['pickupTime'] != null 
          ? DateTime.parse(json['pickupTime']) 
          : null,
      notes: json['notes'],
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
    );
  }

  bool get isPurchase => orderType == 'purchase';
  bool get isClaim => orderType == 'claim';
  bool get isPending => status == 'pending';
  bool get isConfirmed => status == 'confirmed';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
}
```

---

## UI Examples

### Login Screen
```dart
// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();
  
  String _email = '';
  String _password = '';
  bool _isLoading = false;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      final result = await _authService.login(_email, _password);
      
      // Navigate based on role
      if (result['role'] == 'restaurant') {
        Navigator.pushReplacementNamed(context, '/restaurant-home');
      } else if (result['role'] == 'client') {
        Navigator.pushReplacementNamed(context, '/customer-home');
      } else if (result['role'] == 'charity') {
        Navigator.pushReplacementNamed(context, '/charity-home');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Login failed: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                decoration: InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                validator: (value) => 
                    value?.isEmpty ?? true ? 'Required' : null,
                onChanged: (value) => _email = value,
              ),
              SizedBox(height: 16),
              TextFormField(
                decoration: InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (value) => 
                    value?.isEmpty ?? true ? 'Required' : null,
                onChanged: (value) => _password = value,
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _login,
                child: _isLoading 
                    ? CircularProgressIndicator() 
                    : Text('Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### Items List (Customer View)
```dart
// lib/screens/customer/items_list_screen.dart
import 'package:flutter/material.dart';
import '../../services/items_service.dart';
import '../../models/item.dart';

class ItemsListScreen extends StatefulWidget {
  @override
  _ItemsListScreenState createState() => _ItemsListScreenState();
}

class _ItemsListScreenState extends State<ItemsListScreen> {
  final _itemsService = ItemsService();
  List<Item> _items = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadItems();
  }

  Future<void> _loadItems() async {
    try {
      final items = await _itemsService.getItemsForSale();
      setState(() {
        _items = items;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading items: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('Available Items')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text('Available Items')),
      body: RefreshIndicator(
        onRefresh: _loadItems,
        child: ListView.builder(
          itemCount: _items.length,
          itemBuilder: (context, index) {
            final item = _items[index];
            return Card(
              margin: EdgeInsets.all(8),
              child: ListTile(
                leading: item.photo != null
                    ? Image.network(item.photo!, width: 50, height: 50, fit: BoxFit.cover)
                    : Icon(Icons.fastfood, size: 50),
                title: Text(item.name),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (item.description != null) Text(item.description!),
                    SizedBox(height: 4),
                    Text('Quantity: ${item.quantity}'),
                    if (item.hasDiscount)
                      Text(
                        '€${item.price.toStringAsFixed(2)}',
                        style: TextStyle(
                          decoration: TextDecoration.lineThrough,
                          color: Colors.grey,
                        ),
                      ),
                    Text(
                      '€${item.displayPrice.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: item.hasDiscount ? Colors.green : Colors.black,
                      ),
                    ),
                  ],
                ),
                trailing: ElevatedButton(
                  onPressed: () => _buyItem(item),
                  child: Text('Buy'),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _buyItem(Item item) {
    Navigator.pushNamed(context, '/order-create', arguments: item);
  }
}
```

### Charity Items View (Shows Free Items)
```dart
// lib/screens/charity/charity_items_screen.dart
import 'package:flutter/material.dart';
import '../../services/items_service.dart';
import '../../models/item.dart';

class CharityItemsScreen extends StatefulWidget {
  @override
  _CharityItemsScreenState createState() => _CharityItemsScreenState();
}

class _CharityItemsScreenState extends State<CharityItemsScreen> 
    with SingleTickerProviderStateMixin {
  final _itemsService = ItemsService();
  late TabController _tabController;
  
  List<Item> _freeItems = [];
  List<Item> _paidItems = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadItems();
  }

  Future<void> _loadItems() async {
    try {
      final free = await _itemsService.getFreeItems();
      final paid = await _itemsService.getItemsForSale();
      
      setState(() {
        _freeItems = free;
        _paidItems = paid;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Items'),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Free Items'),
            Tab(text: 'For Purchase'),
          ],
        ),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildItemsList(_freeItems, isFree: true),
                _buildItemsList(_paidItems, isFree: false),
              ],
            ),
    );
  }

  Widget _buildItemsList(List<Item> items, {required bool isFree}) {
    return RefreshIndicator(
      onRefresh: _loadItems,
      child: ListView.builder(
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return Card(
            margin: EdgeInsets.all(8),
            child: ListTile(
              leading: Icon(Icons.fastfood, size: 50),
              title: Text(item.name),
              subtitle: Text('Quantity: ${item.quantity}'),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (isFree)
                    Chip(
                      label: Text('FREE'),
                      backgroundColor: Colors.green,
                    )
                  else
                    Text(
                      '€${item.displayPrice.toStringAsFixed(2)}',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ElevatedButton(
                    onPressed: () => _orderItem(item),
                    child: Text(isFree ? 'Claim' : 'Buy'),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _orderItem(Item item) {
    Navigator.pushNamed(context, '/order-create', arguments: item);
  }
}
```

### Restaurant Item Management
```dart
// lib/screens/restaurant/my_items_screen.dart
import 'package:flutter/material.dart';
import '../../services/items_service.dart';
import '../../models/item.dart';

class MyItemsScreen extends StatefulWidget {
  @override
  _MyItemsScreenState createState() => _MyItemsScreenState();
}

class _MyItemsScreenState extends State<MyItemsScreen> {
  final _itemsService = ItemsService();
  List<Item> _items = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadItems();
  }

  Future<void> _loadItems() async {
    try {
      final items = await _itemsService.getMyItems();
      setState(() {
        _items = items;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> _toggleAvailability(Item item) async {
    try {
      await _itemsService.toggleAvailability(item.id);
      _loadItems(); // Reload
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Item availability updated')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> _deleteItem(Item item) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete Item'),
        content: Text('Are you sure you want to delete "${item.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _itemsService.deleteItem(item.id);
        _loadItems();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Item deleted')),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('My Items')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text('My Items')),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await Navigator.pushNamed(context, '/item-create');
          _loadItems(); // Reload after creating
        },
        child: Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: _loadItems,
        child: ListView.builder(
          itemCount: _items.length,
          itemBuilder: (context, index) {
            final item = _items[index];
            return Card(
              margin: EdgeInsets.all(8),
              child: ListTile(
                leading: Icon(Icons.fastfood, size: 50),
                title: Text(item.name),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Quantity: ${item.quantity}'),
                    Text('Price: €${item.displayPrice.toStringAsFixed(2)}'),
                    if (item.isFree)
                      Chip(
                        label: Text('FREE for charity'),
                        backgroundColor: Colors.green,
                      ),
                    Chip(
                      label: Text(item.isAvailable ? 'Available' : 'Unavailable'),
                      backgroundColor: item.isAvailable ? Colors.green : Colors.grey,
                    ),
                  ],
                ),
                trailing: PopupMenuButton(
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      child: Text('Edit'),
                      value: 'edit',
                    ),
                    PopupMenuItem(
                      child: Text(item.isAvailable ? 'Mark Unavailable' : 'Mark Available'),
                      value: 'toggle',
                    ),
                    PopupMenuItem(
                      child: Text('Delete'),
                      value: 'delete',
                    ),
                  ],
                  onSelected: (value) {
                    if (value == 'edit') {
                      Navigator.pushNamed(context, '/item-edit', arguments: item);
                    } else if (value == 'toggle') {
                      _toggleAvailability(item);
                    } else if (value == 'delete') {
                      _deleteItem(item);
                    }
                  },
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
```

---

## Best Practices

### 1. Token Refresh
```dart
// Implement automatic token refresh on 401 errors
class ApiService {
  Future<dynamic> get(String endpoint) async {
    try {
      // ... make request
    } catch (e) {
      if (e is http.Response && e.statusCode == 401) {
        // Refresh token
        await _authService.refreshToken();
        // Retry request
        return get(endpoint);
      }
      throw e;
    }
  }
}
```

### 2. Error Handling
```dart
// Centralized error handling
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  
  ApiException(this.message, [this.statusCode]);
  
  @override
  String toString() => message;
}

// In your services
if (response.statusCode != 200) {
  throw ApiException(
    jsonDecode(response.body)['message'],
    response.statusCode,
  );
}
```

### 3. Loading States
```dart
// Use provider for global loading state
class LoadingProvider with ChangeNotifier {
  bool _isLoading = false;
  bool get isLoading => _isLoading;
  
  void setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
```

### 4. Role-Based Navigation
```dart
// Route guard based on role
class RouteGuard extends NavigatorObserver {
  final AuthService _authService = AuthService();
  
  @override
  void didPush(Route route, Route? previousRoute) async {
    final role = await _authService.getUserRole();
    
    if (route.settings.name?.startsWith('/restaurant') == true && role != 'restaurant') {
      // Redirect unauthorized access
      navigator?.pushReplacementNamed('/unauthorized');
    }
  }
}
```

### 5. Offline Support
```dart
// Cache data locally
import 'package:hive/hive.dart';

class CacheService {
  static Future<void> cacheItems(List<Item> items) async {
    final box = await Hive.openBox('items');
    await box.put('cached_items', items.map((i) => i.toJson()).toList());
  }
  
  static Future<List<Item>?> getCachedItems() async {
    final box = await Hive.openBox('items');
    final data = box.get('cached_items');
    if (data != null) {
      return (data as List).map((json) => Item.fromJson(json)).toList();
    }
    return null;
  }
}
```

---

## Summary

✅ **Complete Auth Flow** - Signup, login, token management
✅ **Type-Safe Models** - Dart models matching backend schemas
✅ **Service Layer** - Clean separation of API logic
✅ **Role-Based UI** - Different screens for different roles
✅ **Error Handling** - Proper exception handling
✅ **Loading States** - User feedback during API calls
✅ **Refresh Support** - Pull-to-refresh on lists

Your Flutter app is now ready to integrate with the FoodRescue backend!
