#!encoding=utf-8
"""
upload file to hdfs using pydoop,
invoke analyzer with hdfs path,
after some time, call **get** to get the items.
"""
HOST="http://192.168.4.23:8085"
import requests as r
def hdfs_upload(fname):
	"""
	upload file to hdfs using pydoop,
	used only on server which has hadoop environment.
	"""
	import pydoop.hdfs as hdfs
	import uuid
	rootdir="/temp_docs"
	if not hdfs.path.isdir(rootdir):
		hdfs.mkdir(rootdir)
	url=rootdir+"/"+str(uuid.uuid1())
	hdfs.put(fname,url)
	return url
def post(url,data):
	import requests as r
	import json
	d=json.dumps(data)
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
	return res.json()
def request_get_tags(doc_ids):
	"""
	invoke analyzer with hdfs path,
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
def index_add(key,values):
	return api_call(
		"{}/index/add".format(HOST),
		{
			"key":key,
			'value':values
		}
	)

def index_get(key):
	return api_call(
		"{}/index/get".format(HOST),
		{
			"keyword":key
		}
	)
if __name__ == '__main__':
	fname="/home/hadoop/a.txt"
	doc_id="/temp_docs/d22a4652-6165-11e3-a6a4-001c23dababf"
	doc_id2="/temp_docs/8a041ed8-616b-11e3-87af-001c23dababf"
	# doc_id=hdfs_upload(fname)
	# print doc_id
	# doc_id="1234567"
	# request_get_tags([doc_id])
	# import thread
	# thread.sleep(1000)
	res=index_get(u"聚类")
	for x in res['value']:
		print x['url'].encode('gbk')