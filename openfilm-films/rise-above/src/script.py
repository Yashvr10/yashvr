# Writes src/scenes.json for "Rise Above the Ordinary". The narration is the user's script, word for word.
# Every spoken line is captioned automatically (src/build.mjs). Per visual: stack (hand-written caption), pos,
# behind (a word shown huge behind the figure), framed (a small original shown as a print).
import json, collections, os
S=[]
def sc(i,text,*vis): S.append({"id":i,"text":text,"visuals":list(vis)})
def card(i,**k): S.append({"id":i,**k})
def ph(p,stack=None,pos="tl",kb="in",focus="50% 40%",**k):
    v={"photo":p,"kb":kb,"focus":focus,"pos":pos,**k}
    if stack: v["stack"]=stack
    return v

card("title",card="title",len=6.5)
sc("s01","You don't need a bigger plan. You need an honest one.",
   ph("thinker",focus="50% 30%",behind="honest"))
sc("s02","The kind your pride rejects. And your real life keeps asking for.",
   ph("portrait-armour",focus="50% 20%",behind="pride"))
sc("s03","Your current level feels like an insult.",
   ph("self-portrait-dark",focus="50% 30%",pos="tr",stack="an ~insult~"))
sc("s04","Like a man with your standards shouldn't still be dealing with basic reps, simple routines, ugly rebuilds, small promises, and the embarrassing proof that you're not yet the man you keep trying to convince yourself you are.",
   ph("training-quarters",focus="50% 40%"), ph("blacksmith",cut="ugly",focus="50% 50%"), ph("tired-gleaner",cut="embarrassing",focus="50% 40%"))
sc("s05","That makes the facts harder to face. Not because they're complicated. But because they point to the kind of plan your pride doesn't want to accept.",
   ph("marble-head",focus="50% 30%",stack="harder / to ~face~"))
sc("s06","Once the facts are in front of you, the plan has to become less flattering. It can't be built around the version of you who always sleeps well, stays focused, trains without bargaining, and keeps the promise after the emotion is gone.",
   ph("rosati",focus="50% 30%",pos="tr"), ph("stag-sharkeys",cut="trains",focus="50% 40%"))
sc("s07","It has to be built around the man who is actually here.",
   ph("workman",focus="50% 30%",behind="here"))
sc("s08","The one with your current body. Your current focus. Your current money. Your current routine. Your current level of self-trust.",
   ph("athlete-statue",focus="50% 8%"), ph("labourers",cut="money",focus="50% 50%"))
sc("s09","That's the level you keep resenting.",
   ph("self-portrait-hat",focus="50% 30%",pos="tr",stack="keep / ~resenting~"))
sc("s10","And until you can look at this level honestly, you'll keep building plans that collapse the moment real life touches them.",
   ph("storm-wight",focus="50% 50%",stack="plans that / ^collapse^"))

card("ch1",card="chapter",num="one",title="where the plan starts ~lying~",len=4.0)
sc("s11","The plan usually doesn't fall apart because you had no ambition. It falls apart because it quietly rounded you up.",
   ph("capitol-stairs",focus="50% 50%"))
sc("s12","Not by much. Just enough to make the week look easier than it is.",
   ph("tokyo-rain",focus="50% 45%"))
sc("s13","You assume you'll wake up early because you feel serious right now. You assume you'll stay focused for hours because the plan looks good in your notes.",
   ph("winter-sunrise",focus="50% 50%"), ph("self-portrait-print",cut="stay",focus="50% 30%"))
sc("s14","You assume you'll train five days a week because that's what the version in your head would do. You assume next week will be different without asking why this week wasn't.",
   ph("wrestlers-circus",focus="50% 50%"), ph("ferry-slip",cut="next",focus="50% 50%"))
sc("s15","That's where the mistake begins. Not with lack of ambition. With inaccurate planning.",
   ph("portrait-caillebotte",focus="60% 40%",stack="inaccurate / ^planning^"))
sc("s16","You don't plan from the weak points your life keeps showing you. You plan from the version of yourself you wish those weak points didn't reveal.",
   ph("bronze-bust",focus="50% 35%",stack="the ~weak~ / ^points^"))

card("ch2",card="chapter",num="two",title="build what your life can ~carry~",len=4.0)
sc("s17","An honest plan usually insults your pride at first. Because it doesn't begin with the man you wish you were. It begins with the man you actually are.",
   ph("old-pat",focus="50% 25%",stack="the man / you ~actually~ are"))
sc("s18","It doesn't say: This week, I'll fix everything. It asks: What can this version of you repeat long enough to change?",
   ph("vatican-stairs",focus="50% 50%",stack="repeat / long enough / to ~change~"))
sc("s19","That question has less drama in it. But it has more power.",
   ph("atlas-hercules",focus="50% 40%",stack="more ^power^"))
sc("s20","Progress gets faster when the plan stops fighting reality. You waste less time collapsing, restarting, punishing yourself, and writing another version of the same fantasy.",
   ph("hercules-lion",focus="50% 35%"), ph("pickle-herring",cut="writing",focus="50% 50%"))
sc("s21","You get a plan that can survive the ordinary week, not just the night you feel inspired.",
   ph("dawn-hunter",focus="50% 50%",stack="the ~ordinary~ / week"))
sc("s22","Maybe the honest plan starts with protecting one hour instead of redesigning your whole day. Maybe it starts with removing the easiest failure point before adding another standard. Maybe it starts with keeping one promise for two weeks before trusting yourself with a bigger one.",
   ph("biglin",focus="50% 50%"), ph("laborers-group",cut="removing",focus="50% 40%"), ph("sunrise-clearing",cut="keeping",focus="50% 50%"))
sc("s23","That can feel beneath your ambition. It isn't. It gives your ambition somewhere real to stand.",
   ph("schroon-mountain",focus="50% 50%",stack="somewhere ~real~ / to ^stand^"))
sc("s24","A plan doesn't change your life because it sounds impressive. It changes your life when it fits your real situation well enough to be repeated until it creates real progress.",
   ph("road-menders",focus="50% 50%"))
sc("s25","Build what your real life can carry. Then, when you've gotten stronger from carrying it, make it heavier.",
   ph("forest-road",focus="50% 50%",stack="make it / ^heavier^"))

card("ch3",card="chapter",num="three",title="rise from ~here~",len=4.0)
sc("s26","You don't need to be proud of where you are. Not yet.",
   ph("storm-sea",focus="50% 50%",stack="not ~yet~"))
sc("s27","Some parts of your life may be behind. Some parts may be weaker than you want to admit. Some parts may show years of delay, comfort, avoidance, bad habits, or promises you didn't keep.",
   ph("ruisdael-hills",focus="50% 50%"))
sc("s28","Hating where you are can wake you up. But it's not useful when it makes you reject the man in front of you.",
   ph("old-road-sea",focus="50% 50%"))
sc("s29","He's not your obstacle. He's the one who has to be trained.",
   ph("dawn-sunset-photo",focus="50% 50%",stack="has to be / ^trained^"))
sc("s30","You want to become a man you can respect? Good. Then stop making plans for a man who isn't here yet.",
   ph("mont-maudit",focus="50% 50%"))
sc("s31","Start with the version of you who actually exists today. Not because this is all you'll ever be. But because this is what you have to work with right now.",
   ph("tryon-dawn",focus="50% 50%"))
sc("s32","Your current level isn't where you're meant to stay. It's where the rise has to begin.",
   ph("inness-sunrise",focus="50% 50%",stack="where the ^rise^ / has to ~begin~"))
sc("s33","Build from there. Carry a standard you can repeat. Let it make you stronger. Then rise from there.",
   ph("bierstadt-matterhorn",kb="up",focus="50% 35%",stack="then ^rise^ / from ~there~"))
card("end",card="end",len=8.0)
json.dump({"voice":"bm_george","speed":0.88,"gap":0.55,"scenes":S},open("src/scenes.json","w"),indent=1,ensure_ascii=False)
print("scenes",sum(1 for s in S if "text" in s),"words",sum(len(s["text"].split()) for s in S if "text" in s))
used=[v["photo"] for s in S for v in s.get("visuals",[]) if "photo" in v]
print("dupes",[k for k,c in collections.Counter(used).items() if c>1],"missing",[k for k in used if not os.path.exists(f"assets/photos/{k}.jpg")])
print("unused",sorted(set(f[:-4] for f in os.listdir("assets/photos"))-set(used)))
