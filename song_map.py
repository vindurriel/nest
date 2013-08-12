import web,time,multiprocessing,json,requests
import xiami_api
class roaming:
	def GET(self,t,id):
		if t=="artists":
			return self.artist(id)
		api="Songs.roaming"
		r=xiami_api.api_get(api,{"id":id})
		res=[]
		for song in r:
			res.append({
				"id":song["song_id"],
				"name":song["name"],
				"type":"song"
				})
		return json.dumps(res)
	def artist(self,id):
		headers={
			"user-agent":"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
		}
		res=[]
		r=requests.get("http://www.xiami.com/app/android/artist-similar",params={"id":id},headers=headers)
		artists=r.json()["artists"]
		for a in artists:
			res.append({
				"id":a["artist_id"],
				"name":a["name"],
				"type":"artist"
				})			
		return json.dumps(res)
class info:
	def GET(self,t,ids):
		if ',' in ids:
			ids=ids.split(',')
		else:
			ids=[ids]
		res={
			'nodes':[],
			'links':[]
		}
		api=t[0].upper()+t[1:]+".detail"
		ro=roaming()
		i=0
		hash={}
		for id in ids:
			r= xiami_api.api_get(api, {"id":id})
			if "song" in r:
				r=r["song"]
			name_field="name"
			if t=="artists":
				name_field="artist_name"
			res['nodes'].append({
				"id":id,
				"name":r[name_field],
				"type":t[:-1],
			})
			hash[id]=i
			for x in json.loads(ro.GET(t,id)):
				if x["id"] in hash:
					res['links'].append({
						"source":i,
						"target":hash[x["id"]],
						"value":1,
						})
			i+=1
		return json.dumps(res)	
if __name__ == '__main__':
	print info().GET("artists","1508,2132,1836")