#encoding=utf-8
from search_provider_base import *
class image_search(search_provider_base):
	def search(self,key,dic={}):
		import suds,logging
		if "img" not in dic:
			return {
				"nodes": [],
				'links':[]
			}
		url=self.config.get('url','http://192.168.4.228:8080/MagicTaskService/ModelSearch?wsdl') 
		try:
			client = suds.client.Client(url)
		except Exception, e:
			try:
				print "try again",url
				client = suds.client.Client(url)
			except Exception, e:
				import traceback
				traceback.print_exc()
				print url
				return {
					"nodes": [],
					'links':[]
				}
		bitstream=[]
		bitstream=dic['img'].encode('base64')
		n=client.service.sketchSearch(["img1.png"],[bitstream])
		res=[]
		print n[0][0]
		try:
			for x in n[0]:
				res.append({
					'type':u'referData',
					'id': u"referData_"+unicode(x.modelID),
					'name':u"模型_"+unicode(x.modelID),
					'distance_rank':x.score,
					# 'img': u"/img/smartref/{}.png".format(x.modelView1),
					'obj': u"/files/obj/{}.obj".format(x.modelID),
				})
			# max_score=max([x['distance_rank'] for x in res])
			# import math
			# for x in res:
			# 	x['distance_rank']=math.floor((x['distance_rank']/max_score*4))
		except Exception, e:
			raise
		# res=res[:10]
		return {
			"nodes": res,
			'links':[]
		}
if __name__ == '__main__':
	print image_search().search('')