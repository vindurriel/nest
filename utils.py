#encoding=utf-8
import web
def render_t(tname,globals={}):
	r=web.template.render('.\\templates',globals=globals)
	return getattr(r,tname)()
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