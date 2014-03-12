#encoding=utf-8
def to_unicode(s):
	if type(s)==type(u""):
		return s
	codings=['utf-8','gbk']
	for cod in codings:
		try:
			return s.decode(cod)
		except Exception, e:
			pass
	raise Exception("cannot decode")
def cwd(*args):
    import sys,os
    res=os.path.realpath(os.path.dirname(__file__))
    for x in args:
        res=os.path.join(res,x)
    return res
def get_config(config_name):
	config={}
	try:
		import json
		s=file(cwd(config_name+".conf"),'r').read()
		config=json.loads(s)
	except Exception, e:
		import traceback
		traceback.print_exc()
	return config