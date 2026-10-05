with open(r'C:\Users\ad614\OneDrive\Escritorio\clientflow\backend\src\test_no_async.ts', 'rb') as f:
    content = f.read()
lines = content.split(b'\n')
for i, line in enumerate(lines):
    if i >= 5 and i <= 12:
        print(f'Line {i+1}: {repr(line)} (len={len(line)})')