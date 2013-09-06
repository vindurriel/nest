#encoding=utf-8
import os,sys,json,requests,traceback
from utils import cwd
urls=[]
import web
web.config.debug=False
config=web.storage(static=cwd('static'))
web.template.Template.globals['config']=config
for x in [x.split() for x in file(cwd('routers.txt'),'r').readlines()]:
    if not x or len(x)!=2:continue;
    urls.append(x[0])
    urls.append(x[1])
    cmd='from {0} import {0}'.format(x[1])
    try:
        exec(cmd)
    except Exception, e:
        pass
web.webapi.internalerror = web.debugerror
app = web.application(urls, globals(), autoreload=True)
class static:
    def GET(self,media, filename):
        import mimetypes
        mime_type = mimetypes.guess_type(filename)
        web.header('Content-Type', "%s"%mime_type[0])  
        try:
            f = file(cwd("static",media,filename), 'r')
            return f.read()
        except :
            traceback.print_exc()
            return '' # you can send an 404 error here if you want
class favicon:
	def GET(self):
		return ""
application=app.wsgifunc()
if __name__ == "__main__":
    app.run()
    a=1