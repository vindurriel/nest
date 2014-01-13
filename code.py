#encoding=utf-8
import os,sys,json,requests,traceback,web
from utils import *

### router
router="""
/ model
/list model.list
/model/load/(.+) model.load
/model(?:/)?  model
/explore(?:/)?  explore
/search(?:/)?  search
/favicon.ico favicon
/(js|css|files|img)/(.+) static
/services(?:/)?  search.service
/keyword/(.+) model.keyword
/play/(.+) model.play
/automate(?:/)? automate
"""
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
        
web.config.debug=False
web.template.Template.globals['config'] = web.storage(static=cwd('static'))
app = web.application(urls, globals(), autoreload=True)
application=app.wsgifunc()
class static:
    '''

    '''
    def GET(self,media, filename):
        import mimetypes
        mime_type = mimetypes.guess_type(filename)[0]
        if filename.lower().endswith(".png"):
            mime_type="image/png" 
        elif filename.lower().endswith(".svg"):
            mime_type="image/svg+xml"
        web.header('Content-Type', "%s"%mime_type)
        try:
            f = file(cwd("static",media,filename), 'rb').read()
            return f
        except IOError:
            traceback.print_exc()
            web.notfound() #send http 404
class favicon:
	def GET(self):
		web.redirect('/img/favicon.png')
if __name__ == "__main__":
    app.run()
    a=1