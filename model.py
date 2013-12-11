#encoding=utf-8
import web
from utils import *
def get_file_name(name,ext=".json"):
	return cwd("static","files",u"{}{}".format(name,ext))
class model:
	def GET(self,key="1769077491"):
		print "###model.get##",key
		theme="light"
		if "theme" in web.input(): theme=web.input().theme
		render=web.template.render(cwd('templates'),globals=locals())
		return render.model()
	def POST(self,key):
		'''
		save
		'''
		import json
		data=json.loads(web.data())
		print "###model.post##"
		file(get_file_name(key),"w").write(json.dumps(data,indent=2))
		return "ok"
class list:
	def GET(self):
		theme="light"
		if "theme" in web.input(): theme=web.input().theme
		import os
		l=os.listdir(cwd('static','files'))
		l= filter(lambda x:x.endswith(".json"),l)
		l= map(lambda x:decode(x)[:-5],l)
		static=cwd("static")
		render=web.template.render(cwd('templates'),globals=locals())
		return render.list()
class keyword:
	def GET(self,key="机器学习"):
		fname=cwd("static","files", "cluster",key)
		res={}

		import os,json
		if not os.path.isfile(fname):
			return json.dumps({"error":"json file not found"})
		# web.header('Content-Type', 'application/json')
		sentence=file(fname,'r').read()
		import jieba,jieba.analyse
		tags=jieba.analyse.extract_tags(sentence,10)
		words = jieba.cut(sentence)
		freq = {}
		total=0.0
		stop_words= set([
		"where","the","of","is","and","to","in","that","we","for","an","are","by","be","as","on","with","can","if","from","which","you","it","this","then","at","have","all","not","one","has","or","that"
		])
		for w in words:
		    if len(w.strip())<2: continue
		    if w.lower() in stop_words: continue
		    freq[w]=freq.get(w,0.0)+1.0
		    total+=freq[w]
		tags=dict([(x,freq[x])  for x in tags])
		import summarize
		summary=summarize.summarize(sentence)
		return json.dumps({"keyword":tags,"summary":summary})
class load:
	def GET(self,key="机器学习"):
		web.header('Content-Type', 'application/json')
		web.header('Cache-Control', 'private, must-revalidate, max-age=0')
		web.header('Expires', 'Thu, 01 Jan 1970 00:00:00')
		import os,json
		fname=get_file_name(key)
		print fname
		res={}
		if not os.path.isfile(fname):
			return json.dumps({"error":"json file not found"})
		raw=file(fname,"r").read()
		return json.dumps(json.loads(raw),indent=2)
class play:
	def GET(self,key="机器学习"):
		import os
		web.header('Content-Type', 'text/plain')
		fname=get_file_name(key,ext=".txt")
		print fname
		raw=file(fname,"r").read()
		return raw
class service:
	def GET(self):
		import json
		web.header('Content-Type', 'application/json')
		res={
			'services':[
				{'id':'REGSVC','name':"线性回归",'select':False,},
				{'id':'MDOSVC','name':"多目标优化",'select':False,},
				{'id':'baike','name':"百科",'select':True,},
				{'id':'wolfram_alpha','name':"wolfram alpha",'select':False,},
			]
		}
		return json.dumps(res,indent=2)