#encoding=utf-8
class search_provider_base:
	def __init__(self):
		self.result={}
	def json(self,res):
		import json
		return json.dumps(res,indent=2)
	def search(self,key,dic={}):
		import json
		res=[]
		return self.json(res)