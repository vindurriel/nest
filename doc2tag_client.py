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
def request_get_tags(doc_ids):
	"""
	invoke analyzer with hdfs path,
	"""
	service_url="{}/topic/add/{}/10".format(HOST,doc_ids)
	res=r.get(service_url,data={
		"docs":doc_ids
	})
	res.raise_for_status()
	print res.json()
	return
def get_tags(doc_ids):
	service_url="{}/topic/get/{}/10".format(HOST,doc_ids)
	print service_url
	res=r.get(service_url,data={
		"docs":doc_ids
	})
	res.raise_for_status()
	print res.json()
	return res.json()
if __name__ == '__main__':
	fname=""
	# doc_id=hdfs_upload(fname)
	doc_id="1234567"
	request_get_tags(doc_id)
	# import thread
	# thread.sleep(1000)
	get_tags([doc_id])