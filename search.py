#encoding=utf-8
__all__=['search']
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
			resque.put((serviceType,s.search(key,dic)))
		except Exception, e:
			traceback.print_exc()
			resque.put((serviceType,{"nodes":[],"links":[]}))
		print "###done searching",serviceType
	def __init__(self):
		import sys
		sys.path.append(cwd('lib'))
		import SearchProviders
		self.search_factory=SearchProviders.factory
		self.result={}
	def handle_upload(self,input):
		try:
			import uuid
			fname=cwd('static','img', str(uuid.uuid1())+'.png')
			s=input.myfile.file.read()
			file(fname,'wb').write(s)
			return json.dumps({"message":"ok"})
		except Exception, e:
			traceback.print_exc()
			return json.dumps({"error":str(e)})
	def POST(self):
		timeout=3
		import json
		web.header('Content-Type', 'application/json')
		dic={}
		input=web.input(myfile={})
		try:
			dic=json.loads(web.data())
		except Exception, e:
			return self.handle_upload(input)
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
		key_node = {
			'type':"query",
			'name':key,
			'id':"query_"+key,
		}
		res['nodes'].append(key_node)
		for service,service_res in results:
			service_node={
				'type':"SearchProvider",
				'name':u"{} 返回的结果".format(service),
				'id':u"SearchProvider_"+service,
			}
			res['nodes'].append(service_node)
			res['links'].append({
				'source':key_node['id'],
				'target':service_node['id']
			})
			if hasattr(service_res,'has_key') and len(service_res['nodes'])>0:
				for x in service_res['nodes']:
					res['nodes'].append(x)
					res["links"].append({
						'source':service_node['id'],
						'target':x['id']
					})
				for x in service_res['links']:
					res['links'].append(x)
		return json.dumps(res)
if __name__ == '__main__':
	pass