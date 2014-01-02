#encoding=utf-8
import requests as r
import json,traceback
from search_provider_base import *
def parse_tree(this,dad,g):
	t="smartref_category"
	is_leaf= not this['children'] and dad
	is_root= this['children'] and not dad
	if is_leaf:
		t="smartref_item"
		n={
			'name':normalize_text(this['text']),
			'type':t,
			'id': this['instanceId'] or this['libraryId'],  #u"{}_{}".format(t,this['libraryId']),
			'content':"->".join(dad)
		}
		n['img']="http://192.168.4.119:8096/SmartRefFiles/{}/{}_7.jpg".format(n['id'],n['id'])
		g['nodes'].append(n)
	else:
		dad.append(normalize_text(this['text']))
		for child in this['children']:
			parse_tree(child,dad,g)
class smartref(search_provider_base):
	def search(self,key,dic={}):
		g={
			'nodes':[],
			"links":[],
		}
		url='http://192.168.4.119:8096/Service/Getdata'
		headers={ "user-agent":"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"}
		try:
			res=r.get(url,params={
				"name":key,
			},headers=headers) 
			res.raise_for_status()
			parse_tree(res.json()[0],[],g)
		except Exception, e:
			try:
				print "try again",url
				res=r.get(url,params={
					"name":key,
				},headers=headers) 
				res.raise_for_status()
				parse_tree(res.json()[0],[],g)
			except Exception, e:
				traceback.print_exc()
				print url
		return g
if __name__ == '__main__':
	res=smartref().search(u'ing')
	file("..\\..\\static\\files\\c21hcnRyZWY=.json",'w').write(json.dumps(res,indent=2)) 