#encoding=utf-8
'''usage: xiami_api.exe method_name file_input_args'''
import requests as r
import sys,os
AGOO_APPKEY="21465214"
client_id="b71cb423efae3395372e2b29788baf31"
# client_id="55ee94348aeba2635326059e60d20a49"
client_secret="b5e2fbb9ed9c24dc7f035715f8ab4a6c"
timestamp=""
def new_time():
	global timestamp
	import time
	timestamp=str(int(time.time()))
	return timestamp
def cwd(*args):
	d=os.path.dirname(sys.argv[0])
	for x in args:
		d=os.path.join(d,x)
	return d
def md5(raw):
	import hashlib
	return hashlib.md5(raw).hexdigest()
def get_new_token(username,password):
	url_new_token="http://api.xiami.com/api/oauth2/token"
	if len(password)!=32:
		password=md5(password)
	postObject={
	  "grant_type":"password",
	  "username":username,
	  "password":password,
	  "client_id":client_id,
	  "client_secret":client_secret,
	}
	resp=r.post(url_new_token,postObject)
	json=resp.json()
	if 'error' in json:
		die(json["error"])
	file(cwd("access_token"),'w').write(json["access_token"])
	return json["access_token"],json["refresh_token"]
def get_api_signature(dic,secret):
	res=""
	for k in sorted(dic.iterkeys()):
		res+=k+str(dic[k])
	res="data="+res
	return md5(secret+res+secret)
def api_get(method,params={}):
	url_api="http://api.xiami.com/api"
	dic={
		"method":method,
		"api_key":client_id,
		"call_id":new_time(),
		'av':"android_40",
	}
	for k,v in params.iteritems():
		dic[k]=v
	dic["api_sig"]=get_api_signature(dic,client_secret)
	access_token=""
	f=cwd("access_token")
	if os.path.isfile(f):
		access_token=file(f,'r').read()
	dic['access_token']=access_token
	# print dic
	resp=r.post(url_api,data=dic)
	json=resp.json()
	if "err" in json and json["err"]: 
		die(json['err'])
	if 'error' in json and json["error"]:
		die(json['error'])
	return json['data']
def print_json(what):
	import json
	print json.dumps(what,encoding="gbk")
def die(why):
	with file("xiami_api.log",'a') as f:
	 f.write(why.encode("gbk"))
	 f.write("\n")
	print_json({"error":why})
	if __name__ == '__main__':
		sys.exit(0)
if __name__ == '__main__':
	if len(sys.argv)<2:
		die(__doc__) 
	method=sys.argv[1]
	if "help" in method:
		die(__doc__) 
	args=sys.argv[2:]
	if method=="get_new_token":
		u,p=args
		access_token,refresh_token=get_new_token(u,p)
		print_json({"access_token":access_token,"refresh_token":refresh_token})
	elif method=="api_get":
		if len(args)==0:
			die("api method missing") 
		m=args[0]
		dic={}
		if len(args)>1:
			try:
				for x in args[1:]:
					k,v=x.split('=')
					dic[k]=v
			except Exception, e:
				die("api method %s args error: %s"%(m,args))
		res=api_get(m,dic)
		print_json(res)
	else:
		die("unknown method:"+method)