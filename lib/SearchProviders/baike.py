#encoding=utf-8
def decode(s):
	if type(s)==type(u""):
		return s
	codings=['utf-8','gbk']
	for cod in codings:
		try:
			return s.decode(cod)
		except Exception, e:
			pass
	raise Exception("cannot decode")
def iso(x):
	return x
def distinct(l,id_fun=iso):
	res=[]
	seen=set()
	for x in l:
		if not id_fun(x) in seen:
			res.append(x)
			seen.add(id_fun(x))
	return res
def get_docs(term,dic={},limit=10):
	import re,uuid
	import requests as r
	from BeautifulSoup import BeautifulSoup as bs
	term=decode(term).strip().replace('&nbsp;','')
	if dic.get('is_subview',False):
		url="http://baike.baidu.com"+dic['url']
	else:
		url="http://baike.baidu.com/search/word"
	res=r.get(url,params={
			'word':term.encode('gbk'),
			'pic':1,
		})
	res.raise_for_status()
	content=decode(res.content)
	if u"您所进入的词条不存在" in content:
		print "term not found:",term
		return []
	soup=bs(content)
	links=soup.findAll('a',href=re.compile(r'/(?:sub)?view/\d+(?:/\d+)?.htm'))
	urls=[]
	urls.append({
		"url":res.url,
		"name":u"百科:"+term,
		'type':'referData',
		"id":u"referData_"+term,
	})
	refs=soup.find(attrs={'class':re.compile(r'\breference\b')})
	if refs!=None:
		refs=refs.findAll('a')
		for x in refs:
			if x['href'].startswith('#ref'): continue
			text=decode(x.text).replace('&nbsp;'," ").strip()
			if text==u"":
				continue
			urls.append({
				"url":x['href'],
				"name":text,
				'type':u'referData',
				"id":u'referData_'+text
			})
	urls=distinct(urls,lambda x:x['id'])
	return {
		"nodes": urls,
		'links':[],
	}
def json_print(dic):
	import json
	return json.dumps(dic,indent=2)
#encoding=utf-8
from search_provider_base import search_provider_base
class baike(search_provider_base):
	def search(self,key,dic={}):
		return get_docs(key,dic)
if __name__ == '__main__':
	print json_print(baike().search('联合国'))