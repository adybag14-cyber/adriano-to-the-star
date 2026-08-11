import os

# Define exact content for users file (standard /etc/passwd format for user 'user')
# Using \n (LF) only, no Windows CRLF
content = b"user:x:1000:1000:user:/files:/dev/null\n"

path = "cheerpj_dist/4.2/etc/users"
with open(path, "wb") as f:
    f.write(content)

print(f"Wrote {len(content)} bytes to {path}")

# Fix localtime as well just in case (empty file is valid for UTC)
path_time = "cheerpj_dist/4.2/etc/localtime"
with open(path_time, "wb") as f:
    f.write(b"") # Empty is fine
print(f"Wrote 0 bytes to {path_time}")
