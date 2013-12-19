#!/usr/bin/env python
#
# Autogenerated by Thrift Compiler (0.9.1)
#
# DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
#
#  options string: py
#

import sys
import pprint
from urlparse import urlparse
from thrift.transport import TTransport
from thrift.transport import TSocket
from thrift.transport import THttpClient
from thrift.protocol import TBinaryProtocol

from filetransform import FileTransform
from filetransform.ttypes import *

if len(sys.argv) <= 1 or sys.argv[1] == '--help':
  print ''
  print 'Usage: ' + sys.argv[0] + ' [-h host[:port]] [-u url] [-f[ramed]] function [arg1 [arg2...]]'
  print ''
  print 'Functions:'
  print '  bool exists(string path)'
  print '  void mkdir(string path)'
  print '  void store(File file)'
  print '   ls(string path)'
  print '  bool isDirectory(string path)'
  print '  string getParentFile(string path)'
  print '  void createNewFile(string path)'
  print '  void deleteFile(string path)'
  print '  void deleteOnExit(string path)'
  print '  bool isFile(string path)'
  print '  void rename(string srcPath, string destPath)'
  print '  string getName(string path)'
  print '  i64 totalSpace(string path)'
  print '  i64 usedSpace(string path)'
  print '  string read(string path)'
  print ''
  sys.exit(0)

pp = pprint.PrettyPrinter(indent = 2)
host = '192.168.4.23'
port = 9090
uri = ''
framed = False
http = False
argi = 1

if sys.argv[argi] == '-h':
  parts = sys.argv[argi+1].split(':')
  host = parts[0]
  if len(parts) > 1:
    port = int(parts[1])
  argi += 2

if sys.argv[argi] == '-u':
  url = urlparse(sys.argv[argi+1])
  parts = url[1].split(':')
  host = parts[0]
  if len(parts) > 1:
    port = int(parts[1])
  else:
    port = 80
  uri = url[2]
  if url[4]:
    uri += '?%s' % url[4]
  http = True
  argi += 2

if sys.argv[argi] == '-f' or sys.argv[argi] == '-framed':
  framed = True
  argi += 1

cmd = sys.argv[argi]
args = sys.argv[argi+1:]

if http:
  transport = THttpClient.THttpClient(host, port, uri)
else:
  socket = TSocket.TSocket(host, port)
  if framed:
    transport = TTransport.TFramedTransport(socket)
  else:
    transport = TTransport.TBufferedTransport(socket)
protocol = TBinaryProtocol.TBinaryProtocol(transport)
client = FileTransform.Client(protocol)
transport.open()

if cmd == 'exists':
  if len(args) != 1:
    print 'exists requires 1 args'
    sys.exit(1)
  pp.pprint(client.exists(args[0],))

elif cmd == 'mkdir':
  if len(args) != 1:
    print 'mkdir requires 1 args'
    sys.exit(1)
  pp.pprint(client.mkdir(args[0],))

elif cmd == 'store':
  if len(args) != 1:
    print 'store requires 1 args'
    sys.exit(1)
  pp.pprint(client.store(eval(args[0]),))

elif cmd == 'ls':
  if len(args) != 1:
    print 'ls requires 1 args'
    sys.exit(1)
  pp.pprint(client.ls(args[0],))

elif cmd == 'isDirectory':
  if len(args) != 1:
    print 'isDirectory requires 1 args'
    sys.exit(1)
  pp.pprint(client.isDirectory(args[0],))

elif cmd == 'getParentFile':
  if len(args) != 1:
    print 'getParentFile requires 1 args'
    sys.exit(1)
  pp.pprint(client.getParentFile(args[0],))

elif cmd == 'createNewFile':
  if len(args) != 1:
    print 'createNewFile requires 1 args'
    sys.exit(1)
  pp.pprint(client.createNewFile(args[0],))

elif cmd == 'deleteFile':
  if len(args) != 1:
    print 'deleteFile requires 1 args'
    sys.exit(1)
  pp.pprint(client.deleteFile(args[0],))

elif cmd == 'deleteOnExit':
  if len(args) != 1:
    print 'deleteOnExit requires 1 args'
    sys.exit(1)
  pp.pprint(client.deleteOnExit(args[0],))

elif cmd == 'isFile':
  if len(args) != 1:
    print 'isFile requires 1 args'
    sys.exit(1)
  pp.pprint(client.isFile(args[0],))

elif cmd == 'rename':
  if len(args) != 2:
    print 'rename requires 2 args'
    sys.exit(1)
  pp.pprint(client.rename(args[0],args[1],))

elif cmd == 'getName':
  if len(args) != 1:
    print 'getName requires 1 args'
    sys.exit(1)
  pp.pprint(client.getName(args[0],))

elif cmd == 'totalSpace':
  if len(args) != 1:
    print 'totalSpace requires 1 args'
    sys.exit(1)
  pp.pprint(client.totalSpace(args[0],))

elif cmd == 'usedSpace':
  if len(args) != 1:
    print 'usedSpace requires 1 args'
    sys.exit(1)
  pp.pprint(client.usedSpace(args[0],))

elif cmd == 'read':
  if len(args) != 1:
    print 'read requires 1 args'
    sys.exit(1)
  pp.pprint(client.read(args[0],))

else:
  print 'Unrecognized method %s' % cmd
  sys.exit(1)

transport.close()