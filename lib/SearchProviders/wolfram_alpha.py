#encoding=utf-8
from search_provider_base import search_provider_base
class wolfram_alpha(search_provider_base):
	def search(self,key,dic):
		import requests as r
		import elementtree.ElementTree as ET
		import time
		# key="momentum m=12kg, v=30m/s"
		# key='momentum m=12kg, v=30m/s'
		url_api="http://api.wolframalpha.com/v2/query"
		dic={
			'input':key,
			'appid':'LHGPTW-JA2LAWJ47R',
			'format':'image'
		}
		res=r.get(url_api,params=dic)
		file('a.xml','w').write(res.content)
		root=ET.parse('a.xml').getroot()
		result=[]
		for x in root:
			tag=x.tag
			if tag=="pod":
				result.append({
            'id':x.get('title'),
						'type':x.get('scanner'),
						'name':x.get('title'),
						'img': x.find('.//img').get('src').replace('&amp;','&'),
					}) 
			elif tag=="assumptions":
				for a in x.findall('.//value'):
					result.append({
						'name':a.get('desc'),
						'id':a.get('input'),
						'type':'assumption',
					})
		return {
			"nodes": result,
			'links':[]
		}
