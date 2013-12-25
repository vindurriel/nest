#encoding=utf-8
from search_provider_base import search_provider_base
class REGSVC(search_provider_base):
	def search(self,key,dic={}):
		import uuid
		res=[]
		self.name=u"线性回归"
		if type(key)==type(""):
			key=key.decode('utf-8','ignore')
		self.id="REGSVC"
		import suds,logging
		url='http://192.168.4.228:8080/MosaicService/MosaicSearchSvc?wsdl'
		client = suds.client.Client(url)
		pageInfo={
			'pageNum':1,
			'pageSize':10,
		}
		info={
			'serviceType':dic.get('serviceType',self.id),
			'keyVaueInfo':{'key':'keywords','value':key},
			'options':[{'key':'timeout','value':'3'}],
		}
		resp=client.service.search(pageInfo,info)
		for r in resp:
			code=str(r.operationInfo.code)
			desc=r.operationInfo.desc
			res.append({
				'name':self.name,
				'type':self.name,
				'id':"{0}-{1}".format(self.id,uuid.uuid1()),
				'content':desc,
			})
		return {
			"nodes": res,
			'links':[]
		}