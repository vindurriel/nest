#encoding=utf-8
from search_provider_base import search_provider_base
class baike_crawler(search_provider_base):
	def search(self,key,dic={}):
		import suds,logging
		self.result={}
		serviceType=dic.get('serviceType','baiduBaikeCrawler')
		node_prefix=u"知识点:"
		url='http://192.168.4.228:8080/ContentService/CrawledIndex?wsdl'
		client = suds.client.Client(url)
		pageInfo={
			'pageNum':1,
			'pageSize':10,
		}
		info={
			'serviceType':serviceType,
			'keyVaueInfo':{'key':'keywords','value':key},
		}
		logging.basicConfig(filename="a.log",level=logging.INFO)
		logging.getLogger('suds.client').setLevel(logging.DEBUG)
		n=client.service.getEntityList(pageInfo,info)
		code=str(n.operationInfo.code)
		if code!="200":
			return []
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
		res=self.result.values()
		if len(res)>6:
			res=res[0:6]
		return res