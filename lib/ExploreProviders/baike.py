#encoding=utf-8
from explore_provider_base import *
class baike(explore_provider_base):
	def explore(self,key,dic={}):
		import re
		import requests as r
		from BeautifulSoup import BeautifulSoup as bs
		limit=10
		term=normalize_text(key)
		url_explore="http://baike.baidu.com/search/word"
		if dic.get('is_subview',False):
			url_explore="http://baike.baidu.com"+dic['url']
		res=r.get(url_explore,params={
				'word':term.encode('gbk'),
				'pic':1,
		})
		res.raise_for_status()
		content=normalize_text(res.content)
		if u"您所进入的词条不存在" in content:
			print "term not found:",term
			return []
		soup=bs(content)
		links=soup.findAll('a',href=re.compile(r'/(?:sub)?view/\d+(?:/\d+)?.htm'))
		urls={}
		for x in links:
			text=normalize_text(x.text)
			if x['href'] in urls:
				continue
			if text==term:
				continue
			if text==u"":
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
		#sort urls by text occurence
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
				text=normalize_text(x.text)
				if text==u"":
					continue
				urls.append({
					"url":x['href'],
					"name":text,
					'type':'referData',
					"id":text,
				})
		for x in map(lambda x:x['name'].encode('gbk'),urls):
			print x
		return urls
if __name__ == '__main__':
	print jsonfy(baike().explore('联合国'))