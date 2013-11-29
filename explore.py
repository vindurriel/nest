#encoding=utf-8
from utils import *
import web,time,json,requests,traceback
class explore:
	def __init__(self):
		import sys
		sys.path.append(cwd('lib'))
		import ExploreProviders
		self.factory=ExploreProviders.factory
		self.result={}
	def explore(self,key,serviceType,dic={}):
		print "###exploring",serviceType
		self.result[serviceType]= self.factory(serviceType).explore(key,dic)
	def POST(self):
		import json
		web.header('Content-Type', 'application/json')
		dic=json.loads(web.data())
		tid=dic['keys']
		i=tid.rindex('_')
		dic['type'],key=tid[:i],tid[i+1:]
		services=dic.get('services',['xiami','baike'])
		for service in services:
			if service=="": continue
			try:
				self.explore(key,service,dic)
			except Exception, e:
				traceback.print_exc()
		res={
			tid:[]
		}
		for x in self.result.values():
			for y in x:
				res[tid].append(y)
		return json.dumps(res)
if __name__ == '__main__':
	ro=explore()
	inf=info()
	import json
	print json.dumps(ro.explore(u"baike_中国"),indent=2)
	# print inf.GET("song_1508")
	# print inf.GET("artist_1508")
	# print inf.GET("album_1508")
	# print ro.GET("song_1508")
	# print ro.GET("artist_1508")
	# print ro.GET("hitsongs_of_artist_1508")
	# print ro.GET("albums_of_artist_1508")
	# print ro.GET("songs_of_album_1508")
	# print ro.GET("artist_of_album_1508")
	# print ro.GET("artist_of_song_1508")
	# print ro.GET("album_of_song_1508")