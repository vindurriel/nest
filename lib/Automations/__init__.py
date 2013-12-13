#encoding=utf-8
__all__=['do_automate','Node']
import os,sys,json,traceback,web
host="http://localhost:8888"
sep_line=u"\n##########\n"
sep_item=u"\t"
seed=u"中国"
def cwd(*args):
    import sys,os
    res=os.path.realpath(os.path.dirname(__file__))
    for x in args:
        res=os.path.join(res,x)
    return res
class Node(object):
	"""docstring for Node"""
	def __init__(self,dic):
		self.id=unicode(dic.get('id',""))
		self.name=unicode(dic.get('name',""))
		self.type=unicode(dic.get('type',""))
		self.index=int(dic.get('index',-1))
		self.distance_rank=int(dic.get('distance_rank',0))
	def __str__(self):
		return self.name
	def __dictify__(self):
		return {
			"id":self.id,
			"name":self.name,
			"type":self.type,
			"index":self.index,
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
class LogLine(object):
	def __init__(self,event,nodes,links):
		import time
		self.event=event
		self.nodes=nodes
		self.links=links
		self.timestamp=time.time()
	def __unicode__(self):
		return sep_item.join([
			str(int(self.timestamp)),
			self.event,
			print_json(self.nodes),
			print_json(self.links)])
	def __dictify__(self):
		return {
			"event":self.event,
			"nodes": self.nodes,
			"links": self.links,
			"timestamp":str(int(self.timestamp)),
		}
class LogStory:
	def __init__(self):
		self.lines=[]
		import time
		self.start_time=time.time()
	def add(self,line):
		assert isinstance(line,LogLine)
		line.timestamp-=self.start_time
		self.lines.append(line)
	def tell(self):
		return print_json(map(dictify, self.lines))
def print_json(d):
	import json
	res=json.dumps(d,indent=2)
	return res
def _post_json(url,data):
	import requests as r
	import json
	d=json.dumps(data)
	#print d
	res= r.post(url,
		data=d,
		headers={
		 'Content-Type':'application/json',
		})
	res.raise_for_status()
	return res.json()

def search(key):
	res=_post_json("{}/search".format(host),{
		"keys":key,
		"services":["baike"]
	})
	return SearchResult(map(Node,res['nodes']))
def explore(node):
	res=_post_json("{}/explore".format(host),{
			"keys":u"baike_"+node.name,
			"services":["baike"]
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
	assert hasattr(nodes,"__iter__")
	assert hasattr(links,"__iter__")
	nodes=map(Node,nodes)
	links=map(Link,links)
	logger=LogStory()
	logger.add(LogLine("draw",map(dictify,nodes),map(dictify,links)))
	h_nodes=dict(map(lambda x:(x.id,x), nodes))
	links=set(map(lambda x:(x.source,x.target),links))
	explored=set()
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
		for x in h_nodes:
			if x in explored: continue
			node=h_nodes[x]
			if node.type==u"referData":continue
			if node.distance_rank > max_depth-1: continue
			print "##exploring node",node.id.encode("gbk")
			break
		if node==None:
			print "##no node to explore; terminated"
			break
		## explore this node
		node_index=node.index
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
			if n.id not in h_nodes:
				h_nodes[n.id]=n
				n.distance_rank=node.distance_rank+1
				n.index=len(h_nodes)-1
				step['nodes'].append(dictify(n))
				if (node_index,n.index) not in links:
					links.add((node_index,n.index))
					step['links'].append({"source":node_index,"target":n.index})
		explored.add(node.id)
		if len(step['nodes']):
			logger.add(LogLine("explore",step['nodes'],step['links']))
		print "##loop end with num",len(h_nodes)
	outfile=cwd("..","..","static","files","{}.txt".format(out_fname))
	print "##writing files to",outfile
	file(outfile,'w').write(logger.tell())
	return logger
if __name__ == '__main__':
	nodes=[{
		"id":u"baike_曼德拉",
		"name":u"曼德拉",
		"type":u"baike",
	}]
	links=[]
	do_automate(nodes,links,{"timeout_seconds":5})