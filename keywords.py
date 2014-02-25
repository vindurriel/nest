#encoding=utf-8
#根据文件名，返回该文件的关键词和摘要
import web
from utils import *
#分词工具
import jieba,jieba.analyse
#摘要工具
import summarize
class keywords:
	def GET(self,key):
		#文件名
		fname=cwd("static","files", "cluster",key)
		res={}
		import os,json
		if not os.path.isfile(fname):
			return json.dumps({"error":"file not found"})
		web.header('Content-Type', 'application/json')
		sentence=file(fname,'r').read()
		tags=jieba.analyse.extract_tags(sentence,10)
		words = jieba.cut(sentence)
		freq = {}
		total=0.0
		#todo：从文件导入停用词
		stop_words= set([
		"where","the","of","is","and","to","in","that","we","for","an","are","by","be","as","on","with","can","if","from","which","you","it","this","then","at","have","all","not","one","has","or","that"
		])
		#统计词频
		for w in words:
		    if len(w.strip())<2: continue
		    if w.lower() in stop_words: continue
		    freq[w]=freq.get(w,0.0)+1.0
		    total+=freq[w]
		tags=dict([(x,freq[x])  for x in tags])
		summary=summarize.summarize(sentence)
		#\n换成<br>，为了在html中显示
		summary=summary.replace('\n',"<br>")
		# print summary
		return json.dumps({"keyword":tags,"summary":summary})
if __name__ == '__main__':
	print keywords().GET('02JGE_-1274270126.pdf.txt')