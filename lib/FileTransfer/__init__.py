__all__ = ['ttypes', 'constants', 'FileTransferClient']
def cwd(*args):
    import sys,os
    res=os.path.realpath(os.path.dirname(__file__))
    for x in args:
        res=os.path.join(res,x)
    return res
def get_config(config_name):
	config={}
	try:
		import json
		s=file(cwd(config_name+".conf"),'r').read()
		config=json.loads(s)
	except Exception, e:
		import traceback
		traceback.print_exc()
	return config
class FileTransferClient(object):
	def __init__(self):
		from thrift.protocol import TBinaryProtocol
		from thrift.transport import TTransport
		from thrift.transport import TSocket
		from FileTransfer import Client
		config=get_config("FileTransfer")
		host=config.get("host","192.168.4.23") 
		port=config.get("port",9090)
		socket = TSocket.TSocket(host, port)
		self.transport = TTransport.TBufferedTransport(socket)
		protocol = TBinaryProtocol.TBinaryProtocol(self.transport)
		self.hdfs=Client(protocol)
	def __getattr__(self,attr):
		if hasattr(self.hdfs,attr):
			return getattr(self.hdfs,attr)
		raise AttributeError()
	def __enter__(self):
		self.transport.open()
		return self
	def __exit__(self,type,value,traceback):
		self.transport.close()

