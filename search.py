#encoding=utf-8
import web
from utils import *
class search:
	def search(self,key,serviceType,dic={}):
		print "###searching",serviceType
		s=self.search_factory(serviceType)
		self.result[serviceType]= s.search(key,dic)
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
		for service in services:
			if service=="": continue
			try:
				self.search(key,service,dic)
			except Exception, e:
				traceback.print_exc()
		res={
			'nodes':[],
			'links':[],
		}
		for x in self.result.values():
			for y in x:
				res['nodes'].append(y)
		return json.dumps(res)