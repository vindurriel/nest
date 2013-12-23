#encoding=utf-8
import os,base64,json,traceback
from neo4jrestclient.client import GraphDatabase,Node,Relationship
node_properties="id name type url img".split()
gdb = GraphDatabase("http://localhost:7474/db/data")
files=[x for x in os.listdir('.') if x.endswith('.json')]
from collections import OrderedDict
ol=0
def normalize_link(x,nodes):
	global ol
	if isinstance(x,int):
		if x>=len(nodes) or x<0:
			print ol
			raise AttributeError(x)
		return nodes.values()[x]['gn']
	elif isinstance(x,str) or isinstance(x,unicode):
		return nodes[x]['gn']
	print type(x)
	raise AttributeError(x)
def get_node(node_id):
	q = u"""match (n) where  n.id="{}" return n""".format(node_id)
	res = gdb.query(q=q,returns=(Node))
	if len(res)>0:
		return res[0][0]
	return None
def get_link(source,target):
	# print source
	q =	 u"""match n-[r]-m where  n.id="{}" and m.id="{}" return n""".format(source['id'],target['id'])
	res = gdb.query(q=q)
	if len(res)>0:
		return res[0][0]
	return None
def run(files):
	global ol
	for f in files:
		print f
	  	graph=json.loads(file(f,"r").read())
	  	for n in graph['nodes']:
	  		if "id" not in n:
	  			n['id']=n['name']
	  		if "_" not in n['id']:
	  			n['id']=u"{}_{}".format(n.get('type',"unknown"),n['name'])
	  	ol=len(graph['nodes'])
	  	nodes=OrderedDict(map(lambda x:(x["id"],x),graph['nodes']))
	  	with gdb.transaction(commit=False)  as tx:
		  	for n in nodes.values():
		  		if "id" not in n:
		  			n['id']=n['name']
		  		if "_" not in n['id']:
		  			n['id']=u"{}_{}".format(n.get('type',"unknown"),n['name'])
		  		try:
		  			gn= get_node(n['id'])
			  		if not gn:
						gn = gdb.node()
						for p in node_properties:
							gn[p]=n.get(p,'')
					n['gn']=gn
		  		except Exception, e:
		  			pass
			for l in graph['links']:
				try:
					source=normalize_link(l['source'],nodes)
					target=normalize_link(l['target'],nodes)
					gl=get_link(source,target)
					if not gl:
						gl=source.relationships.create("related",target)
						gl['source']=source['id']
						gl['target']=target['id']
				except Exception,e:
					pass
			tx.commit()
	  	# break
run(files)

# print len(result)
