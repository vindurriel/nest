import web,time,json,requests,traceback
import xiami_api
def split_id(ids):
	if type(ids)==type([]):
		return ids
	if ',' in ids:
		ids=ids.split(',')
	else:
		ids=[ids]
	return ids
class roaming:
	headers={
		"user-agent":"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
	}
	def GET(self,tid):
		print "###roaming",tid
		res=[]
		self.info=info()
		if '_' not in tid:
			return json.dumps({tid:res})
		i=tid.rindex('_')
		t,id=tid[:i],tid[i+1:]
		if "baike" in t:
			res = self.baike(tid)
		func_name=t.replace('.','_')
		if hasattr(self,func_name):
			res = getattr(self,func_name)(id)
		return json.dumps({tid:res})
	def artist_of_song(self,id):
		return self._artist_of('song',id)
	def artist_of_album(self,id):
		return self._artist_of('album',id)
	def _artist_of(self,t,id):
		r=json.loads(self.info.GET(t+'_'+id))["nodes"][0]
		return [{
			'id':r["artist_id"],
			'name':r['artist_name'],
			'type':'artist',
		}]
		return res
	def album_of_song(self,id):
		r=json.loads(self.info.GET('song_'+id))["nodes"][0]
		return [{
			'id':r["album_id"],
			'name':r['album_name'],
			'type':'album',
		}]
	def songs_of_album(self,id):
		api="Albums.detail"
		res=[]
		r=xiami_api.api_get(api,{"id":id})
		for song in r["songs"]:
			res.append({
				"id":song["song_id"],
				"name":song["name"],
				"type":"song"
			})
		return res
	def songs_of_collect(self,id):
		api="Collects.detail"
		res=[]
		r=xiami_api.api_get(api,{"id":id})
		for song in r["songs"]:
			res.append({
				"id":song["song_id"],
				"name":song["name"],
				"type":"song"
			})
		return res		
	def baike(self,id):
		import model
		res=[]
		proxy=model.search()
		try:
			res=json.loads(proxy.GET(id))
		except Exception,e:
			traceback.print_exc()
		return res
	def hitsongs_of_artist(self,id):
		api="Artists.hotSongs"
		res=[]
		r=xiami_api.api_get(api,{"id":id})
		for song in r["songs"]:
			res.append({
				"id":song["song_id"],
				"name":song["name"],
				"type":"song"
			})
		return res
	def albums_of_artist(self,id):
		api="Artists.albums"
		res=[]
		r=xiami_api.api_get(api,{"id":id})
		for album in r['albums']:
			res.append({
				"id":album["album_id"],
				"name":album["album_name"],
				"type":"album"
			})
		return res
	def song(self,id):
		api="Songs.roaming"
		res=[]
		r=xiami_api.api_get(api,{"id":id})
		for song in r:
			res.append({
				"id":song["song_id"],
				"name":song["name"],
				"type":"song"
			})
		return res
	def artist(self,id):
		res=[]
		r=requests.get(
			"http://www.xiami.com/app/android/artist-similar",
			params={"id":id},
			headers=self.headers)
		for a in r.json()["artists"]:
			res.append({
				"id":a["artist_id"],
				"name":a["name"],
				"type":"artist"
			})			
		return res
def captalize(t):
	return t[0].upper()+t[1:]
class info:	
	def tryset(self,dic,keys):
		for k in keys:
			if k in dic:
				return dic[k]
		return ''
	def GET(self,tid):
		print "###info",tid
		res={
			'nodes':[],
			'links':[]
		}
		if '_' not in tid:
			return res
		i=tid.rindex('_')
		t,id=tid[:i],tid[i+1:]
		api=captalize(t)+"s.detail"
		r= xiami_api.api_get(api, {"id":id})
		if r and "error" not in r:
			if "song" in r:
				r=r["song"]
			res['nodes'].append({
				"id":tid,
				"name":self.tryset(r,['name',t+'_name']),
				"artist_name":self.tryset(r,['artist_name']),
				"artist_id":self.tryset(r,['artist_id']),
				"album_id":self.tryset(r,['album_id']),
				"album_name":self.tryset(r,['album_name']),
				"type":t,
			})
		return json.dumps(res)	
if __name__ == '__main__':
	ro=roaming()
	inf=info()
	print inf.GET("song_1508")
	print inf.GET("artist_1508")
	print inf.GET("album_1508")
	print ro.GET("song_1508")
	print ro.GET("artist_1508")
	print ro.GET("hotsongs_of_artist_1508")
	print ro.GET("albums_of_artist_1508")
	print ro.GET("songs_of_album_1508")
	print ro.GET("artist_of_album_1508")
	print ro.GET("artist_of_song_1508")
	print ro.GET("album_of_song_1508")