#encoding=utf-8
import os,sys,json
def cluster_result_to_json(infile,outfile):
	files=os.listdir("chouyang")
	files=set(map(lambda x: x.decode('gbk','ignore'),files))
	lines=file(infile,'r').read().split('\n')
	t=""
	dic={}
	nodes=[]
	links=[]
	i=0
	num=0
	for l in lines:
		l=l.strip()
		if l=="":continue
		l=l.decode('utf-8','ignore')
		if l.startswith('###'):
			t=l[3:]
			if t not in dic:
				dic[t]=i
				nodes.append({
					'index':i,
					'name':t,
					'type':"relationship",
					'id':t
				})
				i+=1
			continue
		name,value=l.split('\t')
		name=name[1:]
		if name not in files:
			continue
		num+=1
		nodes.append({
			'name':name.encode('utf-8'),
			'type':'doc',
			'id':l,
			'index':i,
			'url':'/files/cluster/{0}'.format(name.encode('utf-8'))
		})
		j=0
		keywords={}
		if l in keywords:
			for kw in keywords[name]:
				j+=1
				nodes.append({
					'name':kw,
					'id':'keyword_'+kw,
					'type':'keyword',
					'index':i+j,
				})
				links.append({
					'source':i,
					'target':i+j,
				})
		links.append({
			'source':dic[t],
			'target':i,
			'value':value
		}) 
		i+=j+1
	link_by_type={}
	for l in links:
		if l['source'] not in link_by_type:
			link_by_type[l['source']]=[]
		link_by_type[l['source']].append(l)
	link_by_type=map(lambda x: sorted(x,key=lambda y:y['value']) , link_by_type.itervalues())
	NUM_RANK_GRADE=3
	for x in link_by_type:
		i=1
		total=len(x)
		import math
		step=math.ceil(float(total)/NUM_RANK_GRADE)
		for y in x:
			nodes[y['target']]["distance_rank"]=i//step
			i+=1
	import json
	g={'nodes':nodes,'links':links}
	file(outfile,'w').write(json.dumps(g,indent=2))
def make_abstract_files():
	lines=file('zy.txt','r').read().split('###')
	lines=filter(lambda x:x!='',lines)
	for l in lines:
		docname=l[:l.index('\n')].strip().decode('utf-8')
		try:
			file(os.path.join(r'E:\workspace\nest\static\files\cluster',docname).strip(),'w').write(l[l.index('\n')+1:])
		except Exception, e:
			print e
			print docname
def extract_keywords():
	dic={}
	def _extract_keywords(string):
		import re
		string=string.decode('utf-8')
		patterns=[
			re.compile('^keywords:(.+?)$',re.I|re.M),
			re.compile(u'^关键词　(.+?)$',re.I|re.M),
		]
		for p in patterns:
			m=p.search(string)
			if not m:
				continue
			keys= re.split(u"[,，;；]",m.groups(1)[0])
			return map(lambda x:x.strip(),filter(lambda x:x.strip()!="",keys))
		return []
	files=set(os.listdir("chouyang"))
	num_ok=0.0
	for f in files:
		text=file(os.path.join("chouyang",f),'r').read()
		res= _extract_keywords(text)
		if len(res):
			num_ok+=1
			dic[f]=res
	print len(files),num_ok, "{0}%".format(100*num_ok/len(files))
	return dic
cluster_result_to_json("distance.txt",r"E:\workspace\nest\static\files\cluster.json")