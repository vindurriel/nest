#encoding=utf-8
import requests as r
import sys
from BeautifulSoup import BeautifulSoup as bs
from search_provider_base import search_provider_base,cwd
class cnki(search_provider_base):
	def search(self,key,dic={}):
		cache=dic.get('cache',False)
		if not cache:
			s=r.Session()
			res=s.get("http://epub.cnki.net/KNS/request/SearchHandler.ashx",params={
					"action":"",
					"NaviCode":"*",
					"ua":"1.11",
					"PageName":"ASP.brief_default_result_aspx",
					"DbPrefix":"SCDB",
					"DbCatalog":"中国学术文献网络出版总库",
					"ConfigFile":"SCDBINDEX.xml",
					"db_opt":"CJFQ,CJFN,CDFD,CMFD,CPFD,IPFD,CCND,CCJD,HBRD",
					"txt_1_sel":"FT$%=|",
					"txt_1_value1":key,
					"txt_1_special1":"%",
					"his":"0",
					"parentdb":"SCDB",
				})
			res=s.get("http://epub.cnki.net/kns/brief/brief.aspx",params={
					"pagename":"ASP.brief_default_result_aspx",
					"dbPrefix":"SCDB",
					# "dbCatalog":"中国学术文献网络出版总库",
					# "ConfigFile":"SCDBINDEX.xml",
					# "keyValue":"火灾识别",
					"S":"1",
				})
			file(cwd('cnki.html'),"w").write(res.content)
			soup=bs(res.content)
		else:
			soup=bs(file(cwd("cnki.html")).read())
		import re
		items=soup.findAll("a",{"class":"fz14"})
		pattern=re.compile(r"ReplaceJiankuohao\(\'(.*?)\'")
		def make_node(x):
			m=pattern.search(x.text)
			text=bs(m.groups(1)[0]).text
			link=u"http://www.cnki.net"+x['href'].replace(u"/kns/detail",u"/KCMS/detail")
			return {
				"url":link,
				"name":text,
				'type':u'referData',
				"id":u'referData_'+text
			}
		return {
			"nodes":map(make_node,items),
			"links":[]
		}
if __name__ == '__main__':
	import json
	res=cnki().search(u'火灾',{"cache":False})
	print json.dumps(res,indent=2)