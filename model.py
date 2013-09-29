#encoding=utf-8
import web
from utils import *
def get_file_name(name):
	return cwd("static","files",u"{0}.json".format(name))
class model:
	def GET(self,key="1769077491"):
		print "###model.get##",key
		theme="light"
		if "theme" in web.input(): theme=web.input().theme
		render=web.template.render(cwd('templates'),globals=locals())
		return render.model()
	def POST(self,key):
		'''
		save
		'''
		import json
		data=json.loads(web.data())
		print "###model.post##"
		file(get_file_name(key),"w").write(json.dumps(data,indent=2))
		return "ok"
class list:
	def GET(self):
		theme="light"
		if "theme" in web.input(): theme=web.input().theme
		import os
		l=os.listdir(cwd('static','files'))
		l= filter(lambda x:x.endswith(".json"),l)
		l= map(lambda x:x[:-5],l)
		static=cwd("static")
		render=web.template.render(cwd('templates'),globals=locals())
		return render.list()
class load:
	def GET(self,key="机器学习"):
		web.header('Content-Type', 'application/json')
		web.header('Cache-Control', 'private, must-revalidate, max-age=0')
		web.header('Expires', 'Thu, 01 Jan 1970 00:00:00')
		import os,json
		fname=get_file_name(key)
		print fname
		res={}
		if not os.path.isfile(fname):
			return json.dumps({"error":"json file not found"})
		raw=file(fname,"r").read()
		return json.dumps(json.loads(raw),indent=2)
class service:
	def GET(self):
		import json
		web.header('Content-Type', 'application/json')
		res={
			'services':[
				{'id':'REGSVC','name':"线性回归",'select':False,},
				{'id':'MDOSVC','name':"多目标优化",'select':False,},
				{'id':'baike_crawler','name':"百科",'select':True,},
				{'id':'wolfram_alpha','name':"wolfram alpha",'select':False,},
			]
		}
		return json.dumps(res,indent=2)
class search:
	def do_search(self,key):
		import suds,logging
		node_prefix=u"知识点:"
		# url='http://192.168.4.228:8080/ContentService/CrawledIndex?wsdl'
		url='http://192.168.4.228:8080/MosaicService/MosaicSearchSvc?wsdl'
		client = suds.client.Client(url)
		pageInfo={
			'pageNum':1,
			'pageSize':10,
		}
		info={
			'serviceType':serviceType,
			'keyVaueInfo':{'key':'keywords','value':key},
			'options':[{'key':'timeout','value':'3'}],
		}
		logging.basicConfig(filename="a.log",level=logging.INFO)
		logging.getLogger('suds.client').setLevel(logging.DEBUG)
		# n=client.service.getEntityList(pageInfo,info)
		n=client.service.search(pageInfo,info)
		print n
		code=str(n.operationInfo.code)
		print n.operationInfo.desc
		if code!="200":
			return code
		props=dict([(x.key,x.value) for x in n.components[0].properties])
		name=unicode(props["title"])
		self.result[node_prefix+name]={
			"name":node_prefix+name,
			"size":1,
			"type":"referData",
			"url":unicode(props["Url"])
		}
		children={}
		for x in n.components[0].children:
			if hasattr(x,"properties"):
				children.setdefault(x.name,[])
				for y in x.properties:
					y.key=unicode(y.key)
					children[x.name].append(y)
		if "Category" in children:
			for x in children["Category"]:
				self.result[x.key]={"name":x.key,"size":1,"type": serviceType}
		if "ExpandRead" in children:
			for x in children["ExpandRead"]:
				self.result[node_prefix+x.key]={"name":node_prefix+x.key,"size":1,"type": "referData","url":x.value}
		if "ReferData" in children:
			for x in children["ReferData"]:
				self.result[node_prefix+x.key]={"name":node_prefix+x.key,"size":1,"type": "referData","url":x.value}
	def search(self,key,serviceType):
		print "searching",serviceType
		s=self.search_factory(serviceType)
		self.result[serviceType]= s.search(key,{})
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
		services=dic['services'].split('###')
		for service in services:
			if service=="": continue;
			try:
				self.search(key,service)
			except Exception, e:
				pass
		# print self.do_search(key,"baiduBaikeCrawler")
		# print self.do_search(key,"hudongBaikeCrawler")
		res={
			'nodes':[],
			'links':[],
		}
		for x in self.result.values():
			for y in x:
				res['nodes'].append(y)
		return json.dumps(res)
if __name__ == '__main__':
	# print search().do_search(u'a','MDOSVC###REGSVC')
	print search().search(u'中国','baiduBaikeCrawler')