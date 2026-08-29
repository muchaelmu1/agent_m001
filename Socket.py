import socket
import tokenizer from tokenizer

server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
server.bind(('127.0.0.1', 4009))

message, address = server.recvfrom(1024)

print(message)
print('Raw data:', list(message))
print(address)

server.sendto(b"helo from server", address)

print('server is listening')

print("Socket created!")

print("message recieved ", message )