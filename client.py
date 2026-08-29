import  socket

client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

client.sendto(b"helo from client", ('127.0.0.1', 4009))

response, address = client.recvfrom(1024)

print("client connected")
print('message sent')
print('response from server: ', response)