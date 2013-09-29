#encoding=utf-8
__all__=['factory']
from search_provider_base import search_provider_base
import traceback
def factory(cl,*args):
	try:
		m = __import__(cl, globals(), locals(), [],-1)
		res=getattr(m,cl)()
		assert isinstance(res,search_provider_base)
		return res
	except Exception, e:
		traceback.print_exc()
		return search_provider_base()
if __name__ == '__main__':
	s= factory('baike_crawler')
	s.search(u'中国',{'serviceType':"hudongBaikeCrawler"})

