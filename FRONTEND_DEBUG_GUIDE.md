# Frontend Debugging Guide - Items by Restaurant

## Issue: Fetching items by restaurant doesn't work from frontend

The backend endpoint **IS WORKING** and properly configured. Here's how to debug the frontend:

---

## ✅ Backend Verification

The server is running on `http://localhost:3200` and the route is registered:
```
GET /items/restaurant/:restaurantId
```

You can verify this works by testing directly with cURL or Postman.

---

## 🧪 Test the Endpoint

### 1. Test with cURL (Windows CMD)
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" http://localhost:3200/items/restaurant/RESTAURANT_ID
```

### 2. Test with PowerShell
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_ACCESS_TOKEN"
}
Invoke-RestMethod -Uri "http://localhost:3200/items/restaurant/RESTAURANT_ID" -Headers $headers -Method Get
```

### 3. Test with Postman
```
Method: GET
URL: http://localhost:3200/items/restaurant/RESTAURANT_ID
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 🔍 Common Frontend Issues

### Issue 1: CORS Error
**Symptom:** Browser console shows CORS error
**Solution:** The backend already has CORS enabled with `origin: true`

If you still get CORS errors, check:
```dart
// In your Flutter app
final response = await http.get(
  Uri.parse('http://localhost:3200/items/restaurant/$restaurantId'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json', // Add this
  },
);
```

### Issue 2: Authentication Error (401)
**Symptom:** Response says "Unauthorized" or "Invalid token"
**Solution:** Check your token is valid

```dart
// Verify token is being sent
print('Token: $token'); // Debug print
print('Restaurant ID: $restaurantId'); // Debug print
```

### Issue 3: Wrong URL
**Symptom:** 404 Not Found
**Solution:** Ensure URL is correct

❌ Wrong:
```dart
'http://localhost:3200/items/restaurants/$restaurantId' // Note: restaurants (plural)
```

✅ Correct:
```dart
'http://localhost:3200/items/restaurant/$restaurantId' // Note: restaurant (singular)
```

### Issue 4: Invalid Restaurant ID
**Symptom:** "Restaurant not found" or empty array returned
**Solution:** Verify the restaurant ID is a valid MongoDB ObjectId

```dart
// Debug the restaurant ID
print('Restaurant ID length: ${restaurantId.length}'); // Should be 24 characters
print('Restaurant ID: $restaurantId'); // Should be hexadecimal string
```

Valid MongoDB ObjectId example: `671234567890abcdef123456`

### Issue 5: No Items Found
**Symptom:** Empty array returned `[]`
**Solution:** The restaurant exists but has no items

Check if items exist in the database:
1. Create some test items for that restaurant
2. Verify items have the correct `restaurantId` field

---

## 📱 Flutter Code Example

### Correct Implementation

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ItemsService {
  final String baseUrl = 'http://localhost:3200';
  
  Future<List<dynamic>> getItemsByRestaurant(String restaurantId, String token) async {
    try {
      print('🔍 Fetching items for restaurant: $restaurantId');
      
      final url = Uri.parse('$baseUrl/items/restaurant/$restaurantId');
      print('📡 URL: $url');
      
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      print('📊 Status Code: ${response.statusCode}');
      print('📄 Response Body: ${response.body}');
      
      if (response.statusCode == 200) {
        final items = jsonDecode(response.body) as List;
        print('✅ Success! Found ${items.length} items');
        return items;
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized: Check your access token');
      } else if (response.statusCode == 403) {
        throw Exception('Forbidden: Check user role permissions');
      } else if (response.statusCode == 404) {
        throw Exception('Not found: Invalid restaurant ID');
      } else {
        throw Exception('Error: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('❌ Error fetching items: $e');
      rethrow;
    }
  }
}
```

### Usage in Widget

```dart
class RestaurantItemsScreen extends StatefulWidget {
  final String restaurantId;
  
  const RestaurantItemsScreen({required this.restaurantId});
  
  @override
  _RestaurantItemsScreenState createState() => _RestaurantItemsScreenState();
}

class _RestaurantItemsScreenState extends State<RestaurantItemsScreen> {
  final ItemsService _itemsService = ItemsService();
  List<dynamic> items = [];
  bool isLoading = true;
  String? error;
  
  @override
  void initState() {
    super.initState();
    _loadItems();
  }
  
  Future<void> _loadItems() async {
    setState(() {
      isLoading = true;
      error = null;
    });
    
    try {
      // Get token from secure storage
      final token = await _getToken();
      
      if (token == null) {
        throw Exception('No authentication token found');
      }
      
      final fetchedItems = await _itemsService.getItemsByRestaurant(
        widget.restaurantId,
        token,
      );
      
      setState(() {
        items = fetchedItems;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
      
      // Show error to user
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error loading items: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  Future<String?> _getToken() async {
    // Get from secure storage
    final storage = FlutterSecureStorage();
    return await storage.read(key: 'accessToken');
  }
  
  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('Restaurant Items')),
        body: Center(child: CircularProgressIndicator()),
      );
    }
    
    if (error != null) {
      return Scaffold(
        appBar: AppBar(title: Text('Restaurant Items')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text('Error: $error'),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadItems,
                child: Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    
    if (items.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text('Restaurant Items')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.inbox, size: 64, color: Colors.grey),
              SizedBox(height: 16),
              Text('No items found for this restaurant'),
            ],
          ),
        ),
      );
    }
    
    return Scaffold(
      appBar: AppBar(title: Text('Restaurant Items (${items.length})')),
      body: ListView.builder(
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return ListTile(
            title: Text(item['name'] ?? 'Unknown'),
            subtitle: Text('Price: \$${item['price']}'),
            trailing: Text('Qty: ${item['quantity']}'),
          );
        },
      ),
    );
  }
}
```

---

## 🔧 Debugging Checklist

Use this checklist to debug your frontend issue:

- [ ] **Server is running** - Check `http://localhost:3200` is accessible
- [ ] **Route is correct** - `/items/restaurant/:restaurantId` (singular "restaurant")
- [ ] **Token is valid** - Print and verify the JWT token
- [ ] **Restaurant ID is valid** - Must be a 24-character MongoDB ObjectId
- [ ] **Headers are correct** - Include `Authorization: Bearer TOKEN`
- [ ] **CORS is enabled** - Already enabled in backend
- [ ] **Network reachable** - Flutter app can reach localhost:3200
- [ ] **Items exist** - Restaurant has items in the database
- [ ] **User has permission** - Check user role (Restaurant, Customer, or Charity)

---

## 🌐 Network Configuration

### For Flutter Web (Chrome)
If running Flutter web, localhost should work. The backend has CORS enabled.

### For Flutter Mobile (Android Emulator)
Use `10.0.2.2` instead of `localhost`:
```dart
final String baseUrl = 'http://10.0.2.2:3200';
```

### For Flutter Mobile (iOS Simulator)
Use `localhost` or your computer's IP address:
```dart
final String baseUrl = 'http://192.168.1.XXX:3200'; // Replace with your IP
```

### For Real Device
Use your computer's local IP address:
```dart
final String baseUrl = 'http://192.168.1.XXX:3200'; // Replace with your IP
```

To find your IP:
- Windows: `ipconfig` in CMD
- Mac/Linux: `ifconfig` or `ip addr`

---

## 🧪 Quick Test Script

Create a simple test in your Flutter app:

```dart
void testItemsEndpoint() async {
  const token = 'YOUR_TOKEN_HERE';
  const restaurantId = 'YOUR_RESTAURANT_ID_HERE';
  
  final url = Uri.parse('http://localhost:3200/items/restaurant/$restaurantId');
  
  try {
    final response = await http.get(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    print('Status: ${response.statusCode}');
    print('Body: ${response.body}');
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      print('✅ SUCCESS! Items: $data');
    } else {
      print('❌ ERROR: ${response.body}');
    }
  } catch (e) {
    print('❌ EXCEPTION: $e');
  }
}
```

Call this function and check the console output.

---

## 📝 Expected Response Format

When successful, the endpoint returns an array of items:

```json
[
  {
    "_id": "671234567890abcdef123456",
    "name": "Pizza Margherita",
    "description": "Classic Italian pizza",
    "category": "plat",
    "quantity": 15,
    "price": 12.99,
    "discountedPrice": 6.99,
    "isFree": false,
    "isAvailable": true,
    "restaurantId": "671234567890abcdef123456",
    "ownerId": "671234567890abcdef123456",
    "sold": 0,
    "donated": 0,
    "lowStockThreshold": 5,
    "createdAt": "2025-10-22T12:00:00.000Z",
    "updatedAt": "2025-10-22T12:00:00.000Z"
  }
]
```

If no items exist, it returns an empty array: `[]`

---

## ❓ Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Check MongoDB** - Ensure items collection has documents with the correct `restaurantId`
2. **Check backend logs** - Look at the terminal where server is running
3. **Use browser DevTools** - Check Network tab for actual request/response
4. **Test with Postman** - Verify the endpoint works outside of Flutter
5. **Share error details** - Provide the exact error message and console logs

---

## 📞 Quick Reference

**Endpoint:** `GET /items/restaurant/:restaurantId`
**Authentication:** Required (JWT Bearer token)
**Roles allowed:** Restaurant, Customer, Charity
**Response:** Array of Item objects
**Status codes:**
- 200: Success
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (wrong role)
- 404: Not found (invalid restaurant ID)

**Example:**
```
GET http://localhost:3200/items/restaurant/671234567890abcdef123456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Summary

The backend is working correctly. The issue is likely in your Flutter frontend code. Follow the debugging checklist and use the example code provided above. Pay special attention to:

1. **Correct URL** - Use `restaurant` (singular)
2. **Valid token** - Ensure JWT is being sent correctly
3. **Valid restaurant ID** - Must be a 24-character ObjectId
4. **Network connectivity** - Adjust URL for mobile devices if needed

Good luck! 🚀
