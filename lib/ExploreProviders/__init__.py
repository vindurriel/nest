#encoding=utf-8
__all__=['factory']
from explore_provider_base import explore_provider_base
import traceback
def factory(cl,*args):
	try:
		#import from current directory, cl is class name
		m = __import__(cl, globals(), locals(), [],-1)
		res=getattr(m,cl)()
		assert isinstance(res,explore_provider_base)
		return res
	except Exception, e:
		traceback.print_exc()
		#anything goes wrong, return default explore provider
		return explore_provider_base()
if __name__ == '__main__':
	# s= factory('baike_crawler')
	import requests as r
	import json
	headers = {'Content-Type': 'application/json'}
	res=r.post("http://192.168.4.140:8085/index/add",
		data=json.dumps({
			"key":"腾讯",
			"value": [{'url':"d","doc_freq":'12'}],
		}),headers=headers)
	print res.status_code
	print res.content
	# res=s.explore(u'联邦政府',{'serviceType':"baiduBaikeCrawler"})
