#encoding=utf-8
from collections import defaultdict
frequencies=defaultdict(int)
stop_words=set()
DISPLAY_FULLTEXT=True
SUMMARY_RATIO= 0.1
def init_stopwords():
	global stop_words
	stop_words= set(u"where the of is and to in that we for an are by be as on with can if from which you it this then at have all not one has or that".split())
	file_stopwords="stop_words.txt"
	import os
	if os.path.isfile(file_stopwords):
		lines=file(file_stopwords,'r').read().split("\n")
		stop_words=stop_words | set(lines)
def split_to_sentences(text):
	'''Very simple spliting to sentences by [.!?] and paragraphs.
	In real life we'll be much more fancy.
	'''
	import nltk.data
	tokenizer = nltk.data.load('tokenizers/punkt/english.pickle')
	text ="\n\n".join(tokenizer.tokenize(text))
	import re
	sentences=[]
	start = 0
	for match in re.finditer(u'(\s*[。？！]\s*)|(\n{2,})', text):
		sentences.append(text[start:match.end()].strip())
		start = match.end()
	sentences=filter(lambda x:len(x)>2,sentences)
	return sentences
def tokenize(text):
	'''tokenize using jieba
	'''
	import jieba
	return jieba.cut(text)
def token_frequency(text):
	'''Return frequency (count) for each token in the text'''
	res = defaultdict(int)
	for token in tokenize(text):
		res[token] += 1
	return res
def sentence_score(sentences):
	'''get sentence score using word frequencey'''
	global frequencies,stop_words
	if not len(stop_words):
		init_stopwords()
	scores=[]
	import math
	num_sentences=len(sentences)
	len_sentences=map(len,sentences)
	max_len_sentences=max(len_sentences)
	min_len_sentences=min(len_sentences)
	for i,sentence in enumerate(sentences):
		tokens=tokenize(sentence)
		#词频的和，去掉停用词
		score= sum((frequencies[token] for token in tokens if token not in stop_words))
		#削弱句子长度的影响
		length_factor=1-1.0*(len_sentences[i]-min_len_sentences)/max_len_sentences
		score*=length_factor
		#增加句子位置的影响(越靠前越好)
		position_factor=1-1.0*i/num_sentences
		score*=position_factor
		scores.append(score)
	return scores
def create_summary(sentences):
	global frequencies
	summary = []
	import math
	len_sentence=int(math.ceil(len(sentences)*SUMMARY_RATIO))
	len_sentence=max(len_sentence,1)
	len_sentence=min(len_sentence,10)
	score=sentence_score(sentences)
	score=[(i,s) for i,s in enumerate(score)]
	#根据得分排序
	score.sort(key=lambda s:s[1],reverse=1)
	#取出得分靠前的句子
	score=score[:len_sentence]
	#恢复原来句子的顺序
	score.sort(key=lambda s:s[0])
	summary=[sentences[x[0]] for x in score]
	# return set([x[0] for x in score])
	return u'\n'.join(summary)
def decode_text(text):
	for x in ['utf-8','gbk']:
		try:
			return text.decode(x)
		except Exception, e:
			pass
	raise Exception('cannot decode using all codings')
def summarize(text):
	global frequencies
	text=decode_text(text)
	frequencies = token_frequency(text)
	sentences = split_to_sentences(text)
	index = create_summary(sentences)
	return index
	# return (sentences,index)
if __name__ == '__main__':
	from colorize import Color
	clr = Color()  
	s=file('test.txt','r').read()
	sentences,index=summarize(s)
	for i,sentence in enumerate(sentences):
		s=sentence.encode('gbk')
		if i in index:
			clr.print_red_text(s)
		elif DISPLAY_FULLTEXT:
			print s
	print sorted(list(index))