#encoding=utf-8
__all__=['do_automate']
import os,sys,json,traceback
host="http://localhost:8888"
from utils import *
import requests as r
def storage_name(s):
	return u"/temp_docs/"+unicode(md5(s))
class Node(object):
	"""docstring for Node"""
	def __init__(self,dic):
		self.id=unicode(dic.get('id',""))
		self.name=unicode(dic.get('name',""))
		self.type=unicode(dic.get('type',""))
		self.index=int(dic.get('index',0))
		self.url=unicode(dic.get('url',""))
		self.distance_rank=int(dic.get('distance_rank',0))
		self.degree=0
	def __str__(self):
		return self.name
	def __dictify__(self):
		return {
			"id":self.id,
			"name":self.name,
			"type":self.type,
			"index":self.index,
			"url":self.url,
			"distance_rank":self.distance_rank
		}
class Link(object):
	"""docstring for Link"""
	def __init__(self, dic):
		self.source=dic['source']
		self.target=dic['target']
		assert isinstance(self.source,int)
		assert isinstance(self.target,int)
	def __dictify__(self):
		return {
			"source":self.source,
			"target":self.target,
		}
class SearchResult(object):
	"""docstring for SearchResult"""
	def __init__(self,l):
		self.items=list(filter(lambda x:isinstance(x,Node),l))
	def __str__(self):
		res=[]
		for x in self.items:
			res.append(unicode(x))
		return u"\n".join(res)
class LogStory:
	def __init__(self):
		self.lines=[]
		import time
		self.start_time=time.time()
	def add(self,line):
		import time
		line['timestamp']=int(time.time()-self.start_time)
		self.lines.append(line)
	def tell(self):
		return print_json(self.lines)
def print_json(d):
	import json
	res=json.dumps(d,indent=2)
	return res
def _post_json(url,data):
	d=json.dumps(data)
	#print d
	res= r.post(url,
		data=d,
		headers={
		 'Content-Type':'application/json',
		})
	res.raise_for_status()
	return res.json()
def upload(url,items):
	print  "### uploading files"
	ids=[]
	import doc2tag_client as doc2tag
	for url in items:
		try:
			res=r.get(url)
			res.raise_for_status()
			doc_id=doc2tag.upload_str(res.content,storage_name(url))
			ids.append(url)
			print url
		except Exception, e:
			traceback.print_exc()
	print "### add tag extraction tasks"
	doc2tag.add_tags(map(storage_name, ids))
def search(key):
	res=_post_json("{}/search".format(host),{
		"keys":key,
		"services":["baike"]
	})	
	res= SearchResult(map(Node,res['nodes']))
	from multiprocessing import Process
	Process(target=upload,args=([x.url for x in res.items])).start()
	return res
def explore(node):
	res=_post_json("{}/explore".format(host),{
			"keys":u"baike_"+node.name,
			"services":["baike"],
			"url":node.url,
	})
	if not len(res):return None
	res=res[res.keys()[0]]
	res= SearchResult(map(Node,res))
	return res

from collections import OrderedDict,defaultdict
def dictify(o):
	return o.__dictify__()
def do_automate(nodes,links,dic):
	out_fname=dic.get('out_fname',"default")
	max_total_node_num=int(dic.get('max_total_node_num',20))
	max_single_node_num=int(dic.get('max_single_node_num',10))
	timeout_seconds=int(dic.get('timeout_seconds',60))
	max_depth=int(dic.get('max_depth',6))
	blacklist=set(dic.get("blacklist",[]))
	explored=set(dic.get("explored",[]))
	assert hasattr(nodes,"__iter__")
	assert hasattr(links,"__iter__")
	nodes=map(Node,nodes)
	links=map(Link,links)
	logger=LogStory()
	logger.add({
		'event':"draw",
		"nodes":map(dictify,nodes),
		"links":map(dictify,links),
		"blacklist":list(blacklist),
	})
	h_nodes=OrderedDict(map(lambda x:(x.id,x), nodes))
	links=set(map(lambda x:(x.source,x.target),links))
	for l in links:
		h_nodes.values()[l[0]].degree+=1
		h_nodes.values()[l[1]].degree+=1
	while 1:
		##stop condition
		import time
		if (time.time()-logger.start_time)>timeout_seconds:
			print "##timeout; terminated"
			break
		if len(h_nodes)>=max_total_node_num:
			print "##max node num reached; terminated"
			break
		## select node to explore
		node=None
		priority=99999
		for x in h_nodes:
			if x in explored: continue
			if x in blacklist: continue
			n=h_nodes[x]
			if n.type==u"referData":continue
			if n.distance_rank > max_depth-1: continue
			pr=(n.distance_rank+1)*(n.degree+1)
			if pr<priority:
				node=n
				priority=pr
		if node==None:
			print "##no node to explore; terminated"
			break
		## explore this node
		print "##exploring node",node.id.encode("gbk")
		source=node.index
		res=explore(node)
		items=res.items[:min(max_single_node_num,max_total_node_num-len(h_nodes))]
		step={
			"event":'explore',
			"nodes":[],
			"links":[],
		}
		for n in items:
			if "_" not in n.id:
				n.id=u"{}_{}".format(n.type,n.name)
			if n.id in blacklist:continue
			if n.id not in h_nodes:
				h_nodes[n.id]=n
				n.distance_rank=node.distance_rank+1
				n.index=len(h_nodes)-1
				step['nodes'].append(dictify(n))
				target=n.index
			else:
				target=h_nodes[n.id].index
			if (source,target) not in links and (target,source) not in links:
				links.add((source,target))
				h_nodes.values()[source].degree+=1
				h_nodes.values()[target].degree+=1
				step['links'].append({"source":source,"target":target})
		explored.add(node.id)
		if len(step['nodes']):
			logger.add({
				'event':"explore",
				"nodes":step['nodes'],
				"links":step['links'],
			})
		print "##loop end with num",len(h_nodes)
	import base64
	out_fname=base64.b64encode(decode(out_fname).encode('utf-8'))
	outfile=cwd("..","..","static","files","{}.txt".format(out_fname))
	print "##writing files to",outfile
	file(outfile,'w').write(logger.tell())
	return logger

if __name__ == '__main__':
	nodes=[{
		"id":u"baike_人工智能",
		"name":u"人工智能",
		"type":u"baike",
	}]
	links=[]
	res=search(u'计算机')
	# do_automate(nodes,links,{"timeout_seconds":15,"max_single_node_num":5,"max_total_node_num":30})