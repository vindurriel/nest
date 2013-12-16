#!encoding=utf-8
"""
upload file to hdfs using thrift,
invoke analyzer with hdfs path,
after some time, call **get** to get the items.
"""
from utils import *
import requests as r
import sys
sys.path.append(cwd(".."))
HOST="http://192.168.4.23:8085"
class transfer_client(object):
	def __init__(self):
		from thrift.protocol import TBinaryProtocol
		from thrift.transport import TTransport
		from thrift.transport import TSocket
		from FileTransfer import FileTransfer,ttypes
		host="192.168.4.23"
		port=9090
		socket = TSocket.TSocket(host, port)
		self.transport = TTransport.TBufferedTransport(socket)
		protocol = TBinaryProtocol.TBinaryProtocol(self.transport)
		self.hdfs=FileTransfer.Client(protocol)
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
def upload_str(string,url,ext=""):
	from thrift.protocol import TBinaryProtocol
	from thrift.transport import TTransport
	from thrift.transport import TSocket
	from FileTransfer import FileTransfer,ttypes
	url=u"{}{}".format(url,ext)
	with transfer_client() as hdfs:
		hdfs.store(ttypes.File(url,string))
	return url	
def upload_file(fname):
	s=file(fname,'r').read()
	return upload_str(s,fname)
def post(url,data):
	import requests as r
	import json
	d=json.dumps(data,indent=2)
	print d
	return r.post(url,
		data=d,
		headers={
		 'Content-Type':'application/json',
		})
def api_call(url,data):
	print url
	res=post(url,data)
	res.raise_for_status()
	if not len(res.content):
		return {}
	try:
		return res.json()
	except Exception, e:
		import traceback
		traceback.print_exc()
		print res.content
def add_tags(doc_ids):
	"""
	invoke analyzer with hdfs path
	"""
	return api_call(
	 	"{}/topic/add".format(HOST),{
			"urls":doc_ids,
			'topicNum':20
	})
def get_tags(doc_ids):
	return api_call(
	 	"{}/topic/get".format(HOST),{
			"urls":doc_ids,
			'topicNum':20
	})
def add_index(key,values):
	return api_call(
		"{}/index/add".format(HOST),
		{
			"key":key,
			'value':values
		}
	)

def get_index(key):
	return api_call(
		"{}/index/get".format(HOST),
		{
			"keyword":key
		}
	)
if __name__ == '__main__':
	fname="a.htm"
	doc_id="/temp_docs/test1.htm"
	# doc_id=hdfs_upload(fname)
	# add_tags([doc_id])
	# import time
	# time.sleep(2)
	# print get_tags([doc_id])

	# print doc_id
	with transfer_client() as client:
		print client.isDirectory("/ds")