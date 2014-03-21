#encoding=utf-8
'''
网站主文件，用法：python code.py <PORT>
'''
from utils import *
import os,sys,json,requests,traceback,web
# url路由
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
/keyword/(.+) keywords
/play/(.+) model.play
/automate(?:/)? automate
"""
router_fname=cwd("router.txt")
if os.path.isfile(router_fname):
    router=file(router_fname,'r').read()
#web.py 接收一个list作为路由，键值对依次排列
urls=[]
#根据字符串来记录需要import的包
to_imports=set()
for line in router.split("\n"):
    if line=="": continue
    (u,m)=line.split()
    urls.append(u)
    urls.append(m)
    if '.' in m:
        m=m.split('.')[0]
    #只引入当前没有的包
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
#可挂接其他支持wsgi方式的PaaS,如AppFog
wsgi_application=app.wsgifunc()
class static:
    '''
    用来处理静态文件，包括图像、javascript、css、和files
    '''
    #media：静态文件类型， 可选项：js|css|files|img
    def GET(self,media, filename):
        import mimetypes
        mime_type = mimetypes.guess_type(filename)[0]
        if filename.lower().endswith(".png"):
            mime_type="image/png" 
        elif filename.lower().endswith(".svg"):
            mime_type="image/svg+xml"
            web.header('Cache-Control', "public")
            web.header('max-age', "31536000")
        web.header('Content-Type', "%s"%mime_type)
        try:
            f = file(cwd("static",media,filename), 'rb').read()
            return f
        except IOError:
            traceback.print_exc()
            web.notfound() #send http 404
class favicon:
    '''
    负责处理 GET /favicon.ico
    '''
    def GET(self):
        web.redirect('/img/favicon.png')
if __name__ == "__main__":
    app.run()