import os
import re

# regex na vid001.mp4
pattern = re.compile(r"vid(\d{3})\.mp4$", re.IGNORECASE)

files = os.listdir(".")

# znajdź najwyższy numer istniejących vidXXX.mp4
max_index = 0
for f in files:
    m = pattern.match(f)
    if m:
        max_index = max(max_index, int(m.group(1)))

# wybierz TYLKO nowe mp4 (nie vidXXX.mp4)
new_files = sorted(
    f for f in files
    if f.lower().endswith(".mp4") and not pattern.match(f)
)

# nadaj kolejne numery
for i, filename in enumerate(new_files, start=max_index + 1):
    new_name = f"vid{i:03}.mp4"
    os.rename(filename, new_name)
    print(f"{filename} -> {new_name}")