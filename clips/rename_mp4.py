import os

files = sorted(f for f in os.listdir('.') if f.lower().endswith('.mp4'))

for i, filename in enumerate(files, start=1):
    new_name = f"vid{i:03}.mp4"
    os.rename(filename, new_name)
    print(f"{filename} -> {new_name}")
