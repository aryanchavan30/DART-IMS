"""
Custom middleware for handling CORS and security headers for media files
"""

class MediaCORSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add CORS headers for media files
        if request.path.startswith('/media/'):
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type'
            # Allow embedding in iframes from same origin and localhost
            response['X-Frame-Options'] = 'ALLOWALL'
            response['Content-Security-Policy'] = "frame-ancestors 'self' http://localhost:* http://127.0.0.1:*"
        
        return response
