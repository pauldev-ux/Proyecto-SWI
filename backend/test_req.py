import urllib.request, urllib.parse, urllib.error
url = 'http://localhost:8000/api/v1/tramites/referencia/' + urllib.parse.quote('código 1') + '/flujo'
print("URL:", url)
try:
    req = urllib.request.urlopen(url)
    print(req.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.code, e.read().decode('utf-8'))
