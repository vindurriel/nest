#encoding=utf-8
def normalize_text(s):
	if type(s)==type(u""):
		return s.strip().replace("&nbsp;",'')
	for coding in ('utf-8','gbk'):
		try:
			return s.decode(coding)
		except Exception, e:
			pass
	raise Exception("cannot decode")
def jsonfy(dic):
	import json
	return json.dumps(dic,indent=2)
class explore_provider_base:
	def __init__(self):
		self.result={}
	def json(self,res):
		import json
		return json.dumps(res,indent=2)
	def explore(self,key,dic={}):
		import json
		res=[]
		return self.json(res)