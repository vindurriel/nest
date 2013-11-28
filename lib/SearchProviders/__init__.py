#encoding=utf-8
__all__=['factory']
from search_provider_base import search_provider_base
import traceback
def factory(cl,*args):
	try:
		#import from current directory, cl is class name
		m = __import__(cl, globals(), locals(), [],-1)
		res=getattr(m,cl)()
		assert isinstance(res,search_provider_base)
		return res
	except Exception, e:
		traceback.print_exc()
		#anything goes wrong, return default search provider
		return search_provider_base()
if __name__ == '__main__':
	s= factory('baike_crawler')
	res=s.search(u'联邦政府',{'serviceType':"baiduBaikeCrawler"})
