#encoding=utf-8
import sys
sys.path.append('.\\controllers')
import web
urls=[]
web.config.debug=False
for x in [x.split() for x in file('.\\routers.txt','r').readlines()]:
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
class favicon:
	def GET(self):
		return ""
if __name__ == "__main__":
    app.run()