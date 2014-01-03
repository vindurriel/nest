#encoding=utf-8
import web
def decode(s):
	if type(s)==type(u""):
		return s
	codings=['utf-8','gbk']
	for cod in codings:
		try:
			return s.decode(cod)
		except Exception, e:
			pass
	raise Exception("cannot decode")
def render_t(tname,globals={}):
	r=web.template.render('.\\templates',globals=globals)
	return getattr(r,tname)()
def cwd(*args):
    import sys,os
    res=os.path.realpath(os.path.dirname(__file__))
    for x in args:
        res=os.path.join(res,x)
    return res
def getUserId():
	u=web.cookies().get('u')
	if u is None or u=="":
		return None
	return u
def getjs(classname):
	jsfile='.\\static\\js\\%s.js'%classname
	import os
	if os.path.isfile(jsfile):
		return file(jsfile,'r').read()
	else:
		return ""
def getTime(t=None):
	import time
	if not t:t=time.time()
	res=time.strftime("%Y-%m-%d-",time.localtime(t))
	ampm=0
	if time.localtime().tm_hour>15: ampm=1
	res+=str(ampm)
	return res
def tryget(dic,keys):
	for k in keys:
		if k in dic:
			return dic[k]
	return None
if __name__ == '__main__':
	print cwd("lib")