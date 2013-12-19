#encoding=utf-8
import web
from utils import *
import traceback
class search:
	def search(self,key,serviceType,dic={}):
		print "###searching",serviceType
		try:
			s=self.search_factory(serviceType)
			self.result[serviceType]= s.search(key,dic)
		except Exception, e:
			traceback.print_exc()
		print "###done searching",serviceType
	def __init__(self):
		import sys
		sys.path.append(cwd('lib'))
		import SearchProviders
		self.search_factory=SearchProviders.factory
		self.result={}
	def POST(self):
		import json
		web.header('Content-Type', 'application/json')
		dic=json.loads(web.data())
		key=dic['keys']
		services=dic.get('services',[])
		services=filter(lambda x:x!="",services)
		from multiprocessing import Process
		ps=[ Process(target=self.search, args=(key,s,dic))  for s in services ]
		for p in ps: p.start()
		for p in ps: p.join()
		res={
			'nodes':[],
			'links':[],
		}
		for x in self.result.values():
			for y in x:
				res['nodes'].append(y)
		return json.dumps(res)