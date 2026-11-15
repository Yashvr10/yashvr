# Writes src/scenes.json for "Rise Above the Ordinary". The narration is the user's script, word for word.
# Captions (src/build.mjs): every spoken word in the quiet serif layer, except the words an emphasis covers.
# Per visual: pos (where the quiet words sit: l r c tl tr bl br), emph ("line / smaller line": red condensed capitals),
# flash (emphasis one word at a time), behind (emphasis behind the figure's cut-out), accent (a word in the big script),
# ghost (a see-through italic word behind the figure). Tall works are shown whole ("fit"), worked out here.
import json, collections, os
from PIL import Image
S=[]
def sc(i,text,*vis): S.append({"id":i,"text":text,"visuals":list(vis)})
def card(i,**k): S.append({"id":i,**k})
def ph(p,pos="l",kb="in",focus="50% 40%",**k):
    w,h=Image.open(f"assets/photos/{p}.jpg").size
    v={"photo":p,"kb":kb,"focus":focus,"pos":pos,**k}
    if w/h<1.45: v["fit"]=True          # taller than about 3:2: show it whole
    return v

card("title",card="title",len=5.0)
sc("s01","You don't need a bigger plan. You need an honest one.",
   ph("thinker",pos="l",emph="an honest one",behind=True))
sc("s02","The kind your pride rejects. And your real life keeps asking for.",
   ph("portrait-armour",pos="r",accent="pride"))
sc("s03","Your current level feels like an insult.",
   ph("self-portrait-dark",pos="r",emph="an insult"))
sc("s04","Like a man with your standards shouldn't still be dealing with basic reps, simple routines, ugly rebuilds, small promises, and the embarrassing proof that you're not yet the man you keep trying to convince yourself you are.",
   ph("training-quarters",pos="r",emph="basic reps simple routines",flash=True),
   ph("blacksmith",cut="ugly",pos="l",emph="ugly rebuilds small promises",flash=True),
   ph("tired-gleaner",cut="embarrassing",pos="r",accent="convince"))
sc("s05","That makes the facts harder to face. Not because they're complicated. But because they point to the kind of plan your pride doesn't want to accept.",
   ph("marble-head",pos="l",accent="face"))
sc("s06","Once the facts are in front of you, the plan has to become less flattering. It can't be built around the version of you who always sleeps well, stays focused, trains without bargaining, and keeps the promise after the emotion is gone.",
   ph("rosati",pos="r",emph="less flattering"), ph("stag-sharkeys",cut="trains",pos="c"))
sc("s07","It has to be built around the man who is actually here.",
   ph("workman",pos="l",emph="actually here",behind=True))
sc("s08","The one with your current body. Your current focus. Your current money. Your current routine. Your current level of self-trust.",
   ph("athlete-statue",pos="r",emph="body focus",flash=True),
   ph("labourers",cut="money",pos="c",emph="money routine self-trust",flash=True))
sc("s09","That's the level you keep resenting.",
   ph("self-portrait-hat",pos="r",accent="resenting"))
sc("s10","And until you can look at this level honestly, you'll keep building plans that collapse the moment real life touches them.",
   ph("storm-wight",pos="c",emph="plans that collapse"))

card("ch1",card="chapter",num="I",title="Where the plan starts lying",len=3.4)
sc("s11","The plan usually doesn't fall apart because you had no ambition. It falls apart because it quietly rounded you up.",
   ph("capitol-stairs",pos="c",emph="rounded you up"))
sc("s12","Not by much. Just enough to make the week look easier than it is.",
   ph("tokyo-rain",pos="r",accent="easier"))
sc("s13","You assume you'll wake up early because you feel serious right now. You assume you'll stay focused for hours because the plan looks good in your notes.",
   ph("winter-sunrise",pos="c"), ph("self-portrait-print",cut="stay",pos="r",accent="notes"))
sc("s14","You assume you'll train five days a week because that's what the version in your head would do. You assume next week will be different without asking why this week wasn't.",
   ph("wrestlers-circus",pos="c"), ph("ferry-slip",cut="next",pos="c",emph="why this week wasn't"))
sc("s15","That's where the mistake begins. Not with lack of ambition. With inaccurate planning.",
   ph("portrait-caillebotte",pos="l",emph="inaccurate planning"))
sc("s16","You don't plan from the weak points your life keeps showing you. You plan from the version of yourself you wish those weak points didn't reveal.",
   ph("bronze-bust",pos="l",accent="wish"))

card("ch2",card="chapter",num="II",title="Build what your real life can carry",len=4.2)
sc("s17","An honest plan usually insults your pride at first. Because it doesn't begin with the man you wish you were. It begins with the man you actually are.",
   ph("old-pat",pos="l",emph="the man you actually are"))
sc("s18","It doesn't say: This week, I'll fix everything. It asks: What can this version of you repeat long enough to change?",
   ph("vatican-stairs",pos="r",emph="repeat / long enough to change"))
sc("s19","That question has less drama in it. But it has more power.",
   ph("atlas-hercules",pos="l",emph="more power",behind=True))
sc("s20","Progress gets faster when the plan stops fighting reality. You waste less time collapsing, restarting, punishing yourself, and writing another version of the same fantasy.",
   ph("hercules-lion",pos="r",emph="collapsing restarting punishing",flash=True), ph("pickle-herring",cut="writing",pos="c",accent="fantasy"))
sc("s21","You get a plan that can survive the ordinary week, not just the night you feel inspired.",
   ph("dawn-hunter",pos="c",accent="ordinary"))
sc("s22","Maybe the honest plan starts with protecting one hour instead of redesigning your whole day. Maybe it starts with removing the easiest failure point before adding another standard. Maybe it starts with keeping one promise for two weeks before trusting yourself with a bigger one.",
   ph("biglin",pos="c",emph="one hour"), ph("laborers-group",cut="removing",pos="r"), ph("sunrise-clearing",cut="keeping",pos="c",emph="one promise"))
sc("s23","That can feel beneath your ambition. It isn't. It gives your ambition somewhere real to stand.",
   ph("schroon-mountain",pos="c",emph="somewhere real / to stand"))
sc("s24","A plan doesn't change your life because it sounds impressive. It changes your life when it fits your real situation well enough to be repeated until it creates real progress.",
   ph("road-menders",pos="c",accent="progress"))
sc("s25","Build what your real life can carry. Then, when you've gotten stronger from carrying it, make it heavier.",
   ph("forest-road",pos="r",emph="make it heavier"))

card("ch3",card="chapter",num="III",title="Rise from here",len=2.8)
sc("s26","You don't need to be proud of where you are. Not yet.",
   ph("storm-sea",pos="c",emph="not yet"))
sc("s27","Some parts of your life may be behind. Some parts may be weaker than you want to admit. Some parts may show years of delay, comfort, avoidance, bad habits, or promises you didn't keep.",
   ph("ruisdael-hills",pos="c",emph="delay comfort avoidance",flash=True))
sc("s28","Hating where you are can wake you up. But it's not useful when it makes you reject the man in front of you.",
   ph("old-road-sea",pos="c",accent="reject"))
sc("s29","He's not your obstacle. He's the one who has to be trained.",
   ph("dawn-sunset-photo",pos="c",emph="not your obstacle / the one who has to be trained"))
sc("s30","You want to become a man you can respect? Good. Then stop making plans for a man who isn't here yet.",
   ph("mont-maudit",pos="c",accent="respect"))
sc("s31","Start with the version of you who actually exists today. Not because this is all you'll ever be. But because this is what you have to work with right now.",
   ph("tryon-dawn",pos="c",accent="today"))
sc("s32","Your current level isn't where you're meant to stay. It's where the rise has to begin.",
   ph("oise-dawn",pos="c",emph="where the rise / has to begin"))
sc("s33","Build from there. Carry a standard you can repeat. Let it make you stronger. Then rise from there.",
   ph("bierstadt-matterhorn",kb="up",focus="50% 35%",pos="c",emph="rise",flash=True))
card("end",card="end",len=7.0)
json.dump({"voice":"bm_george","speed":1.1,"gap":0.3,"scenes":S},open("src/scenes.json","w"),indent=1,ensure_ascii=False)
print("scenes",sum(1 for s in S if "text" in s),"words",sum(len(s["text"].split()) for s in S if "text" in s))
used=[v["photo"] for s in S for v in s.get("visuals",[]) if "photo" in v]
print("dupes",[k for k,c in collections.Counter(used).items() if c>1],"missing",[k for k in used if not os.path.exists(f"assets/photos/{k}.jpg")])
print("fit",sum(1 for s in S for v in s.get("visuals",[]) if v.get("fit")),"of",len(used))
