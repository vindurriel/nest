#encoding=utf-8
import web
from utils import *
def get_file_name(name,ext=".json"):
	import base64
	return cwd(u"static",u"files",u"{}{}".format(base64.b64encode(decode(name).encode('utf-8')),ext))
class model:
	def GET(self):
		params=web.input()
		theme=params.get("theme","light")
		if "id" in params:
			print "###model.get##",unicode(params.id).encode('gbk')
		elif "q" in params:
			print "###model.search##",unicode(params.q).encode('gbk')
		render=web.template.render(cwd('templates'),globals=locals())
		return render.model()
	def POST(self):
		'''
		save
		'''
		import json
		web.header('Content-Type', 'application/json')
		print "###model.post##"
		params=web.input()
		if "id" not in params:
			return json.dumps({"error":u"未在url参数中指定保存id"})
		key=params.id
		try:
			data=json.loads(web.data())
			file(get_file_name(key),"w").write(json.dumps(data,indent=2))
			return json.dumps({"message":"ok"})
		except Exception, e:
			import traceback
			traceback.print_exc()
			return json.dumps({"error":unicode(e)})
		
class list:
	def GET(self):
		theme=web.input().get("theme","light")
		import os
		l=os.listdir(cwd('static','files'))
		l= filter(lambda x:x.endswith(".json"),l)
		import base64,urllib2
		l= map(lambda x: decode(base64.b64decode(x[:-5])),l)
		l= map(lambda x: (x,urllib2.quote(x.encode("utf-8"))),l)
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
		summary=summary.replace('\n',"<br>")
		return json.dumps({"keyword":tags,"summary":summary})
class load:
	def GET(self,key="机器学习"):
		web.header('Content-Type', 'application/json')
		web.header('Cache-Control', 'private, must-revalidate, max-age=0')
		web.header('Expires', 'Thu, 01 Jan 1970 00:00:00')
		import os,json,urllib2
		key=urllib2.unquote(key)
		fname=get_file_name(key)
		print "###"+key+"###",fname
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
				{'id':'tag2doc','name':"tag2doc",'select':False,},
				{'id':'REGSVC','name':"线性回归",'select':False,},
				{'id':'MDOSVC','name':"多目标优化",'select':False,},
				{'id':'baike','name':"百科",'select':False,},
				{'id':'smartref','name':"Smart Ref",'select':True,},
				{'id':'wolfram_alpha','name':"wolfram alpha",'select':False,},
			]
		}
		return json.dumps(res,indent=2)
