#encoding=utf-8
import web,json,traceback
from utils import *
class neo:
	def get(self,params={}):
		depth=params.get('depth',3)
		q=params.get('q',"artist_10165")
		query =	 u"""start n=node:node_auto_index(id="{}") match n-[r*1..{}]-m  return m,r""".format(q,depth)
		print query
		from neo4jrestclient.client import GraphDatabase,Node,Relationship
		gdb = GraphDatabase("http://localhost:7474/db/data")
		res = gdb.query(q=query,returns=(Node,Relationship))
		return res
	def GET(self):
		web.header('Content-Type', 'application/json')
		params=web.input()
		return self.get(params)
class search:
	def search(self,key,serviceType,dic={}):
		print "###searching",serviceType
		try:
			s=self.search_factory(serviceType)
			self.result[serviceType]= s.search(key,dic)
		except Exception, e:
			traceback.print_exc()
		print "###done searching",serviceType
	def search2(self,key,serviceType,resque,dic={}):
		print "###searching",serviceType
		try:
			s=self.search_factory(serviceType)
			resque.put(s.search(key,dic))
		except Exception, e:
			traceback.print_exc()
			resque.put([])
		print "###done searching",serviceType
	def __init__(self):
		import sys
		sys.path.append(cwd('lib'))
		import SearchProviders
		self.search_factory=SearchProviders.factory
		self.result={}
	def POST(self):
		timeout=3
		import json
		web.header('Content-Type', 'application/json')
		dic=json.loads(web.data())
		key=dic['keys']
		services=dic.get('services',[])
		services=filter(lambda x:x!="",services)
		from multiprocessing import Process,Queue
		q=Queue()
		ps=[ Process(target=self.search2, args=(key,s,q,dic))  for s in services ]
		for p in ps: p.start()
		for p in ps: p.join(timeout)
		res={
			'nodes':[],
			'links':[],
		}
		results=[q.get() for s in services]
		for x in results:
			for y in x:
				res['nodes'].append(y)
		print self.result
		return json.dumps(res)
if __name__ == '__main__':
	neo=neo()
	res=neo.get({})
	print len(res)
	import sys
	sys.exit(0)
	instance=search()
	from multiprocessing import Process,Queue
	key=u"联合国"
	services=["baike",'wolfram_alpha']
	import json
	dic={}
	q=Queue()
	ps=[ Process(target=instance.search2, args=(key,s,q,dic))  for s in services ]
	for p in ps: p.start()
	for p in ps: p.join()
	res={
		'nodes':[],
		'links':[],
	}
	results=[q.get() for s in services]
	for x in results:
		for y in x:
			res['nodes'].append(y)
	print json.dumps(res)