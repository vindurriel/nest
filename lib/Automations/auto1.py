#encoding=utf-8
import os,sys,json,traceback,web
host="http://localhost:8888"
sep_line=u"\n##########\n"
sep_item=u"\t"
seed=u"机器学习"
max_total_node_num=30
max_single_node_num=5
max_depth=5
class Node(object):
	"""docstring for Node"""
	def __init__(self,dic):
		self.id=dic.get('id',u"")
		self.name=dic.get('name',u"")
		self.type=dic.get('type',u"")
		self.index=dic.get('index',-1)
		self.distance_rank=dic.get('distance_rank',0)
	def __str__(self):
		return self.name
	def dictify(self):
		return {
			"id":self.id,
			"name":self.name,
			"type":self.type,
			"index":self.index,
			"distance_rank":self.distance_rank
		}
class Link(object):
	"""docstring for Link"""
	def __init__(self, source,target):
		assert isinstance(source,int)
		assert isinstance(target,int)
		self.source=source
		self.target=target
	def dictify(self):
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
		res=[]
		for x in self.lines:
			res.append(unicode(x))
		return sep_line.join(res)

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
h_nodes={}
explored=set()
logger=LogStory()
root=Node({
	"id":u"baike_"+seed,
	"name":seed,
	"type":u"baike",
	"index":0,
})
h_nodes[u"baike_"+seed]= root

logger.add(LogLine("draw",[root.dictify()],[]))

links=set()
def automate():
	while 1:
		##stop condition
		if len(h_nodes)>=max_total_node_num:
			print "max node num reached; terminated"
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
			if n.id not in h_nodes:
				h_nodes[n.id]=n
				n.distance_rank=node.distance_rank+1
				n.index=len(h_nodes)-1
				step['nodes'].append(n.dictify())
				if (node_index,n.index) not in links:
					links.add((node_index,n.index))
					step['links'].append(Link(node_index,n.index).dictify())
		explored.add(node.id)
		if len(step['nodes']):
			logger.add(LogLine("explore",step['nodes'],step['links']))
		print "##loop end with num",len(h_nodes)
	res=print_json({
		"nodes":map(lambda x:x.dictify(), h_nodes.values()),
		"links":map(lambda x:Link(x[0],x[1]).dictify(), links)
	})
	file(r'..\..\static\files\auto1.json','w').write(res)
	file(r'..\..\static\files\auto1.txt','w').write(logger.tell())
def play():
	import json
	lines=file(r'auto1.txt','r').read().decode('utf-8').split(sep_line)
	for line in lines:
		timestamp,event,info=line.split(sep_item)
		graph=json.loads(info)
		print graph
automate()