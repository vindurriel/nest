#encoding=utf-8
import web
class go:
	def GET(self):
		url=web.input().get("url",None)
		if not url:return
		print "###go",url
		import requests as r
		res=r.get(url)
		return res.content\
		.replace("src=\"/","src=\"http://www.cnki.net/")\
		.replace("href=\"/","href=\"http://www.cnki.net/")