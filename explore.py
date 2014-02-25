#encoding=utf-8
#explore的rest封装类
#explore在lib/ExploreProviders
from utils import *
import web,time,json,requests,traceback
class explore:
	def __init__(self):
		import sys
		sys.path.append(cwd('lib'))
		import ExploreProviders
		self.factory=ExploreProviders.factory
		self.result={}
	def explore(self,key,serviceType,dic={}):
		print "###exploring",serviceType
		#工厂模式
		#如果serviceType不可用，将返回默认exploreProvider
		self.result[serviceType]= self.factory(serviceType).explore(key,dic)
		print "###done exploring",serviceType
	def POST(self):
		import json
		web.header('Content-Type', 'application/json')
		dic=json.loads(web.data())
		tid=dic['keys']
		#为了调用者能分辨返回的是哪次的调用结果
		return_id=dic['return_id']
		#兼容代码
		if "_"in tid:
			i=tid.rindex('_')
			dic['type'],key=tid[:i],tid[i+1:]
		else:
			key=tid
		services=dic.get('services',['xiami','baike'])
		#todo：改成并行模式
		for service in services:
			if service=="": continue
			try:
				self.explore(key,service,dic)
			except Exception, e:
				traceback.print_exc()
		res={
			return_id:[]
		}
		for x in self.result.values():
			for y in x:
				res[return_id].append(y)
		return json.dumps(res)
if __name__ == '__main__':
	ro=explore()
	inf=info()
	import json
	print json.dumps(ro.explore(u"baike_中国"),indent=2)