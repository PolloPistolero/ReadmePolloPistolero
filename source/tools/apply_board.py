#!/usr/bin/env python3
"""Baut aus skel.json (Szenen), reg.json (Medien) und dem Auswahlbrett-Stand (state.json) den FILM-Block der Seite.
Aufruf: python3 tools/apply_board.py   (schreibt FILM in preview.html und sel/board-data.json)"""
import json,re,os,sys
R='/home/claude/site/'
skel=json.load(open(R+'sel/skel.json'));reg=json.load(open(R+'sel/reg.json'));state=json.load(open(R+'sel/state.json'))
def item(k,mid,orig_kind):
    r=reg[mid];f=r.get('file',mid)
    return r,f
def build(k):
    out=[];full=[]
    for e in state[k]:
        s=skel[k][e['i']]
        full.append((e,s))
    live=[]
    for e,s in full:
        if e['off']:continue
        if s['kind']=='q':
            live.append({'k':'q','lb':s['lb'],'q':s['q'],'z':s['z']});continue
        ids=e['m']
        if not ids:continue
        rs=[reg[i] for i in ids];anyv=any(r.get('v') for r in rs);n=len(ids)
        if n==1:
            r=rs[0];kind='vid' if r.get('v') else 'img'
        elif s['kind']=='sw' and not anyv:kind='sw'
        elif n<=3 or anyv:kind='row'
        else:kind='sw'
        c={'k':kind,'lb':s['lb'],'z':s['z']}
        if kind in('img','vid'):
            r=rs[0];c['m']=[r.get('file',ids[0]),r['w'],r['h'],r.get('alt','')]
            if kind=='vid' and r.get('snd'):c['snd']=1
        elif kind=='row':
            c['m']=[[r.get('file',i),r['w'],r['h'],r.get('alt','')]+(['v',r.get('snd',0)] if r.get('v') else []) for i,r in zip(ids,rs)]
        else:
            c['m']=[[r.get('file',i),r.get('label') or r.get('alt') or i] for i,r in zip(ids,rs)]
            c['w']=s.get('w') or rs[0]['w'];c['hh']=s.get('hh') or rs[0]['h']
        live.append(c)
    if live:live[0]['h1']=1
    return live
FILM={k:{'sc':build(k)} for k in state}
js='const FILM='+json.dumps(FILM,ensure_ascii=False,separators=(',',':'))+';\n'
p=R+'preview.html';s=open(p).read()
a=s.index('const FILM=');b=s.index('const trT=')
s=s[:a]+js+s[b:]
meta=json.load(open(R+'sel/meta.json'))
s=re.sub(r'/\*ORDER\*/\{const O=\[.*?\];',lambda m:'/*ORDER*/{const O='+json.dumps(meta['order'])+';',s)
open(p,'w').write(s)
# Daten fürs Auswahlbrett
P=[]
names={'barbershop':('Barbershop Produktmarke','Realprojekt'),'express':('Orhan’s Barbershop','Realprojekt'),'coffee':('Coffeebeans','Pitch'),'caseflow':('CaseFlow','Eigenes Konzept'),'burger':('Beef&Co','Realprojekt'),'doener':('Döner&Co','Realprojekt'),'mix':('Projekte-Mix','Realprojekte'),'felazio':('RF Felazio Koma 19','Eigenes Projekt')}
json.dump({'FILMscenes':{k:len(v['sc']) for k,v in FILM.items()}},open('/tmp/filmcount.json','w'))
print({k:len(v['sc']) for k,v in FILM.items()})
