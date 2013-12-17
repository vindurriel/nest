__all__ = ['ttypes', 'constants', 'FileTransferClient']

class FileTransferClient(object):
	def __init__(self):
		from thrift.protocol import TBinaryProtocol
		from thrift.transport import TTransport
		from thrift.transport import TSocket
		from FileTransfer import Client
		host="192.168.4.23"
		port=9090
		socket = TSocket.TSocket(host, port)
		self.transport = TTransport.TBufferedTransport(socket)
		protocol = TBinaryProtocol.TBinaryProtocol(self.transport)
		self.hdfs=Client(protocol)
	def __getattr__(self,attr):
		if hasattr(self.hdfs,attr):
			return getattr(self.hdfs,attr)
		print "sdfasfasdf"
		raise AttributeError()
	def __enter__(self):
		self.transport.open()
		return self
	def __exit__(self,type,value,traceback):
		self.transport.close()