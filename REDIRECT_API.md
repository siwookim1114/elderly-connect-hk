# Community Platform Redirect API

This API provides endpoints for redirecting users to the Community Platform from other applications.

## Endpoints

### 1. Basic Redirect
**GET** `/api/redirect/community-platform`

Redirects users directly to the community platform (localhost:3000 by default).

**Response:** 302 Redirect to `http://localhost:3000`

### 2. Redirect with User ID
**GET** `/api/redirect/community-platform/{user_id}`

Redirects users to the community platform with their user ID as a query parameter.

**Parameters:**
- `user_id` (string): The user ID to pass to the community platform

**Response:** 302 Redirect to `http://localhost:3000?user_id={user_id}`

### 3. Get Community Platform URL (JSON)
**GET** `/api/community-platform/url`

Returns the community platform URL as JSON without redirecting.

**Response:**
```json
{
  "success": true,
  "url": "http://localhost:3000",
  "message": "Community platform URL retrieved successfully"
}
```

### 4. Get Community Platform URL with User ID (JSON)
**GET** `/api/community-platform/url/{user_id}`

Returns the community platform URL with user ID as JSON without redirecting.

**Parameters:**
- `user_id` (string): The user ID to include in the URL

**Response:**
```json
{
  "success": true,
  "url": "http://localhost:3000?user_id=user123",
  "user_id": "user123",
  "message": "Community platform URL with user ID retrieved successfully"
}
```

## Configuration

The community platform URL can be configured using the `COMMUNITY_PLATFORM_URL` environment variable. If not set, it defaults to `http://localhost:3000`.

```bash
export COMMUNITY_PLATFORM_URL="https://your-domain.com"
```

## Usage Examples

### Web Applications (HTML/JavaScript)

```html
<!-- Direct redirect -->
<a href="http://localhost:8000/api/redirect/community-platform">
  Go to Community Platform
</a>

<!-- Redirect with user ID -->
<a href="http://localhost:8000/api/redirect/community-platform/user123">
  Go to Community Platform
</a>
```

### React Native Apps

```javascript
import { Linking } from 'react-native';

const redirectToCommunityPlatform = async (userId) => {
  try {
    const response = await fetch(`http://localhost:8000/api/community-platform/url/${userId}`);
    const data = await response.json();
    await Linking.openURL(data.url);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Flutter Apps

```dart
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> redirectToCommunityPlatform(String userId) async {
  final response = await http.get(Uri.parse('http://localhost:8000/api/community-platform/url/$userId'));
  final data = json.decode(response.body);
  await launchUrl(Uri.parse(data['url']));
}
```

### Server-Side Applications (Python)

```python
import requests

def get_community_platform_url(user_id=None):
    url = f"http://localhost:8000/api/community-platform/url"
    if user_id:
        url += f"/{user_id}"
    response = requests.get(url)
    return response.json()['url']

# Usage
platform_url = get_community_platform_url('user123')
print(f"Redirect to: {platform_url}")
```

### cURL Examples

```bash
# Test redirect (check headers)
curl -I http://localhost:8000/api/redirect/community-platform

# Test redirect with user ID
curl -I http://localhost:8000/api/redirect/community-platform/user123

# Get URL as JSON
curl http://localhost:8000/api/community-platform/url

# Get URL with user ID as JSON
curl http://localhost:8000/api/community-platform/url/user123
```

## Testing

1. Start the backend server:
   ```bash
   cd backend
   source venv/bin/activate
   python api/main.py
   ```

2. Run the test script:
   ```bash
   python test_redirect_api.py
   ```

3. Open the demo HTML file in your browser:
   ```bash
   open redirect_demo.html
   ```

## Error Handling

- If the backend server is not running, you'll get a connection error
- If MongoDB is not running, the server won't start (but redirect endpoints don't require MongoDB)
- All endpoints return appropriate HTTP status codes

## Security Considerations

- The redirect endpoints are public and don't require authentication
- User IDs are passed as URL parameters, so sensitive information should not be included
- Consider implementing authentication if you need to restrict access to the redirect functionality
