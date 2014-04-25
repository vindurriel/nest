#encoding=utf-8
import web
from utils import *
#对字符串name进行base64编码，这样做既能规避不能用在文件名中的字符，又能不丢失信息第解码。
def get_file_name(name,ext=".json"):
	import base64
	return cwd(u"static",u"files",u"{}{}".format(base64.b64encode(to_unicode(name).encode('utf-8')),ext))
class model:
	#GET方法用来显示model.htm
	def GET(self):
		params=web.input()
		theme=params.get("theme","light")
		if "id" in params:
			print "###model.get##",unicode(params.id).encode('gbk')
		elif "q" in params:
			print "###model.search##",unicode(params.q).encode('gbk')
		render=web.template.render(cwd('templates'),globals=locals())
		return render.model()
	#post方法用来保存静态graph文件
	def POST(self):
		import json
		web.header('Content-Type', 'application/json')
		print "###model.post##"
		params=web.input()
		if "id" not in params:
			return json.dumps({"error":u"未在url参数中指定保存id"})
		key=params.id
		try:
			data=json.loads(web.data())
			if "svg" in data:
				self.save_snapshot(data['svg'],key)
				del data['svg']
			file(get_file_name(key),"w").write(json.dumps(data,indent=2))
			return json.dumps({"message":"ok"})
		except Exception, e:
			import traceback
			traceback.print_exc()
			return json.dumps({"error":unicode(e)})
	def save_snapshot(self,svg,key):
		import cairosvg
		exportPath=get_file_name(key,".png")
		cairosvg.svg2png(bytestring=svg, write_to=exportPath)
class list:
	#返回一个项目列表，输出可以是html，也可以是json，元素类型可以是model，也可以是automate
	def GET(self):
		#theme可选项：light|dark
		theme=web.input().get("theme","light")
		#output可选项：html|json
		output=web.input().get("output","html")
		#类型的可选项：model|automate
		t=web.input().get("type","model")
		import os
		l=os.listdir(cwd('static','files'))
		set_file=set(l)
		ext=".json"
		if t=="automate":
			ext=".txt"
		l= filter(lambda x:x.endswith(ext),l)
		import base64,urllib2
		#base64解码
		decoded= map(lambda x: to_unicode(base64.b64decode(x[:-len(ext)])),l)
		#为了能在html和json中显示
		decoded= map(lambda x: (x,urllib2.quote(x.encode("utf-8"))),decoded)
		if output=='html':
			static=cwd("static")
			render=web.template.render(cwd('templates'),globals=locals())
			return render.list()
		elif output=='json':
			import json
			web.header('Content-Type', 'application/json')
			res=[]
			for i,x in enumerate(l):
				r={
					'name':	decoded[i][0]
				}
				thumb_name=x[:-len(ext)]+".png"
				if thumb_name in set_file:
					r['img']=("/files/"+thumb_name)
				res.append(r)
			return json.dumps(res)
class load:
	#根据文件名来返回单个model
	def GET(self,key="机器学习"):
		web.header('Content-Type', 'application/json')
		web.header('Cache-Control', 'private, must-revalidate, max-age=0')
		web.header('Expires', 'Thu, 01 Jan 1970 00:00:00')
		import os,json,urllib2
		key=urllib2.unquote(key)
		fname=get_file_name(key)
		print fname
		res={}
		if not os.path.isfile(fname):
			return json.dumps({"error":"json file not found"})
		raw=file(fname,"r").read()
		return json.dumps(json.loads(raw),indent=2)
class play:
	#根据文件名来返回单个automate，格式为json
	def GET(self,key="机器学习"):
		import os
		web.header('Content-Type', 'text/plain')
		fname=get_file_name(key,ext=".txt")
		print fname
		if not os.path.isfile(fname):
			return json.dumps({"error":"json file not found"})
		raw=file(fname,"r").read()
		return raw
