#encoding=utf-8
import os,sys,json,requests,traceback,web
from utils import *
web.config.debug=False
config=web.storage(static=cwd('static'))
web.template.Template.globals['config']=config
### router
router="""
/ model.list
/model/load/(.+) model.load
/model(?:/)?  model
/explore(?:/)?  explore
/search(?:/)?  search
/favicon.ico favicon
/(js|css|files|images)/(.+) static
/services(?:/)?  model.service
/keyword/(.+) model.keyword
/play/(.+) model.play
/automate(?:/)? automate
"""
###router
urls=[]
to_imports=set()
for line in router.split("\n"):
    if line=="": continue
    (u,m)=line.split()
    urls.append(u)
    urls.append(m)
    if '.' in m:
        m=m.split('.')[0]
    if not hasattr(sys.modules[__name__],m):
        to_imports.add(m)
for x in to_imports:
    cmd='from {0} import *'.format(x)
    try:
        exec(cmd)
    except Exception, e:
        pass
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