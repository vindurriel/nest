#encoding=utf-8 
from utils import *
import sys,web,time,json,requests,traceback
sys.path.append(cwd('lib'))
from multiprocessing import Process
class automate(object):
	def __init__(self):
		pass
	def POST(self):
		from Automations import do_automate
		web.header('Content-Type', 'application/json')
		dic=json.loads(web.data())
		nodes=dic['nodes'][:]
		links=dic['links'][:]
		del dic['nodes']
		del dic['links']
		p = Process(target=do_automate, args=(nodes,links,dic))
		try:
			p.start()
		except Exception, e:
			traceback.print_exc()
			return json.dumps({'error':str(e)})
		return json.dumps({
			"msg":"ok"
		})
if __name__ == '__main__':
	nodes=[{
		"id":u"baike_曼德拉",
		"name":u"曼德拉",
		"type":u"baike",
	}]
	links=[]
	dic={}
	p = Process(target=do_automate, args=(nodes,links,dic))
	p.start()