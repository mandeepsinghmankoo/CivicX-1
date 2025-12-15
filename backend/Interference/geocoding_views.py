import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def reverse_geocode(request):
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')
    
    if not lat or not lng:
        return JsonResponse({'error': 'Missing lat or lng parameter'}, status=400)
    
    try:
        response = requests.get(
            f'https://nominatim.openstreetmap.org/reverse',
            params={
                'format': 'json',
                'lat': lat,
                'lon': lng
            },
            headers={'User-Agent': 'CivicX-App/1.0'}
        )
        
        if response.status_code == 200:
            data = response.json()
            return JsonResponse({
                'address': data.get('display_name', f'{lat}, {lng}')
            })
        else:
            return JsonResponse({'address': f'{lat}, {lng}'})
            
    except Exception as e:
        return JsonResponse({'address': f'{lat}, {lng}'})

@csrf_exempt
def geocode(request):
    address = request.GET.get('address')
    
    if not address:
        return JsonResponse({'error': 'Missing address parameter'}, status=400)
    
    try:
        response = requests.get(
            f'https://nominatim.openstreetmap.org/search',
            params={
                'format': 'json',
                'q': address
            },
            headers={'User-Agent': 'CivicX-App/1.0'}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data:
                return JsonResponse({
                    'lat': float(data[0]['lat']),
                    'lng': float(data[0]['lon']),
                    'address': data[0]['display_name']
                })
        
        return JsonResponse({'error': 'Address not found'}, status=404)
            
    except Exception as e:
        return JsonResponse({'error': 'Geocoding failed'}, status=500)