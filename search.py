#encoding=utf-8
__all__=['search']
import web,json,traceback
from utils import *
#所有可用的搜索服务
#id用于程序辨识，name、desc和img用于显示，select表示默认是否选中。
class service:
	def all(self):
		return [
				{	'id':'baike','name':"百科",'select':False,
					'desc':'使用百度百科搜索知识点和关联',
					'img':'/img/baidu.png',
				},				
				{	'id':'smartref','name':"Smart Ref",'select':False,
					'desc':'搜索smart ref的零件库',
					'img':'/img/coins.png',
				},
				{	'id':'wolfram_alpha','name':"wolfram alpha",'select':False,
					'desc':'使用wolfram alpha进行工程计算',
					'img':'/img/wolfram_alpha.png',
				},
				{	'id':'REGSVC','name':"线性回归",'select':False,
					'desc':'调用线性回归算法服务',
					'img':'/img/line.png',
				},
				{	'id':'MDOSVC','name':"多目标优化",'select':False,
					'desc':'调用优化算法服务',
					'img':'/img/variable.png',
				},
				{	'id':'image_search','name':"草图搜索",'select':False,
					'desc':'上传草图来搜索零件库中的零件',
					'img':'/img/map.png',
				},				
				{	'id':'cnki','name':"中国知网",'select':True,
					'desc':'搜索中国知网的论文',
					'img':'/img/map.png',
				},
			]
	def GET(self):
		import json
		web.header('Content-Type', 'application/json')
		res={
			'services':self.all(),
		}
		return json.dumps(res)

#search的rest服务包装
#search在lib/SearchProviders
class search:
	#reque为返回结果的队列
	def search(self,key,serviceType,resque,dic={}):
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
	def POST(self):
		timeout=3
		import json
		web.header('Content-Type', 'application/json')
		dic={}
		input=web.input(myfile={})
		try:
			dic=json.loads(web.data())
		except Exception, e:
			try:
				#读取上传的图像文件
				s=input.myfile.file.read()
				dic['img']=s
				dic['keys']=""
				dic['services']=['image_search']
			except Exception, e:
				traceback.print_exc()
				return {'nodes':[],'links':{}}
		key=dic['keys']
		services=dic.get('services',[])
		services=filter(lambda x:x!="",services)
		from multiprocessing import Process,Queue
		q=Queue()
		#为每service创建一个进程
		ps=[ Process(target=self.search, args= (key,s,q,dic))  for s in services ]
		for p in ps: p.start()
		for p in ps: p.join(timeout)
		res={
			'nodes':[],
			'links':[],
		}
		results=[q.get() for s in services]
		#返回结果是一棵树三层的树，根节点为搜索的key，一层节点为调用的搜索服务，
		#二层是服务返回的结果
		#根节点
		key_node = {
			'type':"query",
			'name':u"搜索："+key,
			'id':"query_"+key,
		}
		if "img" in dic:
			key_node['name']="image"
			key_node['id']="query_image"
		res['nodes'].append(key_node)
		services=dict(map(lambda x:(x['id'],x),service().all()))
		for sid,service_res in results:
			#一层为搜索服务节点
			service_node={
				'type':"SearchProvider",
				'name':"{} 返回的结果".format(services[sid]['name']),
				'id':u"SearchProvider_"+sid,
				'img':services[sid]['img'],
			}
			res['nodes'].append(service_node)
			res['links'].append({
				'source':key_node['id'],
				'target':service_node['id']
			})
			if hasattr(service_res,'has_key') and len(service_res['nodes'])>0:
				#二层为搜索服务节点
				for x in service_res['nodes']:
					res['nodes'].append(x)
					res["links"].append({
						'source':service_node['id'],
						'target':x['id']
					})
				for x in service_res['links']:
					res['links'].append(x)
		return json.dumps(res)