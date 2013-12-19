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