#encoding=utf-8
from search_provider_base import search_provider_base
class smartref(search_provider_base):
	def search(self,key,dic={}):
		return []
		import suds,logging
		self.result={}
		serviceType=dic.get('serviceType','baiduBaikeCrawler')
		node_prefix=u"知识点:"
		url='http://192.168.4.119:18050/SmartRefService/meta'
		import requests as r
		res=r.get (url)
		res.raise_for_status()
		try:
			client = suds.client.Client(url)
		except Exception, e:
			import traceback
			traceback.print_exc()
			return []

		client.GetInstanceList({'name':key},0,10)
if __name__ == '__main__':
	smartref().search(u'F')