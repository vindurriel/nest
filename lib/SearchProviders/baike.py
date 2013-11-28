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
def get_related_term(term,dic={},limit=10):
	import re
	import requests as r
	term=decode(term).strip().replace('&nbsp;','')
	if dic.get('is_subview',False):
		url_search_word="http://baike.baidu.com"+dic['url']
	else:
		url_search_word="http://baike.baidu.com/search/word"
	print url_search_word
	res=r.get(url_search_word,params={
			'word':term.encode('gbk'),
			'pic':1,
		})
	res.raise_for_status()
	content=decode(res.content)
	if u"您所进入的词条不存在" in content:
		print "term not found:",term
		return []
	from BeautifulSoup import BeautifulSoup as bs
	soup=bs(content)
	links=soup.findAll('a',href=re.compile(r'/(?:sub)?view/\d+(?:/\d+)?.htm'))
	urls={}
	for x in links:
		text=x.text.strip().replace('&nbsp;','')
		if x['href'] in urls:
			continue
		if text==term:
			continue
		if text.strip()==u"":
			continue
		if len(text)==1:
			continue
		t="baike"
		if "/subview/" in x['href']:
			t+="_subview"
		urls[x['href']]={
			"url":x['href'],
			"name":text,
			'type':t,
			"id":text,
		}
	for x in urls.itervalues():
		x['count']=len(re.findall(x['name'],content))
	urls=sorted(urls.values(),key=lambda x:x["count"],reverse=True)
	# for x in urls[:limit]:
	# 	print x['name'],x['url'],x["count"]
	urls=urls[:limit]	
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
				'type':'referData',
				"id":text,
			})
	print len(urls)
	return urls
def json_print(dic):
	import json
	return json.dumps(dic,indent=2)
#encoding=utf-8
from search_provider_base import search_provider_base
class baike(search_provider_base):
	def search(self,key,dic={}):
		return get_related_term(key,dic)
if __name__ == '__main__':
	json_print(baike().search('联合国'))