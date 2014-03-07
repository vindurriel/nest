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
def cwd(*args):
    import sys,os
    res=os.path.realpath(os.path.dirname(__file__))
    for x in args:
        res=os.path.join(res,x)
    return res
class search_provider_base(object):
	def __init__(self):
		self.result={}
		self.config=self.load_config()
	def json(self,res):
		import json
		return json.dumps(res,indent=2)
	def search(self,key,dic={}):
		import json
		res=[]
		return self.json(res)
	def load_config(self):
		fname=cwd("{}.conf".format(self.__class__.__name__))
		import json
		try:
			return json.loads(file(fname,'r').read())
		except Exception, e:
			raise
			import traceback
			traceback.print_exc()
			return {}