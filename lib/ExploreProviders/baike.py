#encoding=utf-8
from explore_provider_base import *
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
class baike(explore_provider_base):
	def explore(self,key,dic={}):
		import re
		import requests as r
		from BeautifulSoup import BeautifulSoup as bs
		limit=10
		term=normalize_text(key)
		url_explore="http://baike.baidu.com/search/word"
		if "url" in dic and dic['url']!="":
			url_explore="http://baike.baidu.com"+dic['url']
			print "####url is:",url_explore
		else:
			print "####key is:",key
		res=r.get(url_explore,params={
				'word':term,
				'pic':1,
		})
		res.raise_for_status()
		content=normalize_text(res.content)
		if u"您所进入的词条不存在" in content:
			print "####term not found:",term
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
				"id":u"{}_{}".format(t,text),
			}
		#sort urls by text occurence
		for x in urls.itervalues():
			try:
				x['count']=len(re.findall(x['name'],content))
			except Exception, e:
				x['count']=1
		urls=sorted(urls.values(),key=lambda x:x["count"],reverse=True)
		urls=urls[:limit]	
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
				text=normalize_text(x.text)
				if text==u"":
					continue
				urls.append({
					"url":x['href'],
					"name":text,
					'type':'referData',
					"id":u"referData_"+text,
				})
		urls=distinct(urls,lambda x:x["id"])

		for x in map(lambda x:x['name'].encode('gbk'),urls):
			print x
		return urls
if __name__ == '__main__':
	print jsonfy(baike().explore('联合国'))