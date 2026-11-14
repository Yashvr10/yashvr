# Writes src/scenes.json: the script, the picture for each scene, and its captions.
# Caption marks: " / " new line, ~word~ script font, ^word^ big, _word_ small. pos: l r tl tr bl br c
import json
S=[]
def sc(i,text,*vis): S.append({"id":i,"text":text,"visuals":list(vis)})
def card(i,**k): S.append({"id":i,**k})
def ph(p,stack=None,pos="l",kb="in",focus="50% 40%",**k):
    v={"photo":p,"kb":kb,"focus":focus,**k}
    if stack: v["stack"]=stack; v["pos"]=pos
    return v

sc("s01","Somewhere right now, a monk is sitting in a small room, doing one thing. He has been doing it since before sunrise. Nobody is watching him. Nothing is buzzing in his pocket. And his mind, the same kind of mind you have, is quiet.",
   ph("goes-benedictine","doing / ~one~ ^thing^","r",focus="30% 30%"))
sc("s02","Now look at your own day. A message. A headline. A video. Somebody's opinion. An old argument you replay in the shower. Each one takes a small piece of your attention, so quietly that you never feel it leave.",
   ph("latour-fortune","a _small_ piece / of your / ~attention~","tl",kb="right"))
sc("s03","The loss looks small. Five minutes here, ten there. But you are not only losing minutes. You are losing the thread. And you are training your mind to run, the moment anything gets hard.",
   ph("boilly-crowd","losing / the ~thread~","tr",kb="left"))
sc("s04","We look at a monk's focus and call it a gift. Calm by nature. Born that way. It isn't. For fifteen hundred years, monasteries have treated attention as a craft. Something you build, with rules, tools and daily practice.",
   ph("christus-carthusian","attention / _as a_ ~craft~","l",focus="60% 35%"))
sc("s05","This film is that craft, in seven parts. You don't need a robe or a mountain. You need to stop letting everyone else decide where your mind goes.",
   ph("amalfi-cave","where / your ~mind~ / ^goes^","br",focus="50% 50%"))
card("title",card="title",len=6.0)

card("ch1",card="chapter",num="one",title="the noonday ~demon~",len=4.0)
sc("s06","The monks of the Egyptian desert, sixteen hundred years ago, had a name for the moment your focus breaks. They called it the noonday demon.",
   ph("huys-temptation","the ~noonday~ / ^demon^","tl",kb="right",focus="50% 50%"))
sc("s07","One of them, Evagrius, described it exactly. The monk sits down to his work, and the day suddenly feels fifty hours long. He looks out of the window. He wonders if a visitor is coming. He decides his cell is the problem, and that he would do far better somewhere else.",
   ph("bles-temptation","fifty / hours ~long~","tr",kb="left",focus="50% 50%"))
sc("s08","You know this demon. You sit down to the work that matters, and at once the room needs tidying. The phone looks important. Some other task becomes urgent. It feels like preparing. It is running away.",
   ph("footman-sleeping","it is / ~running~ / ^away^","r",focus="45% 50%"))
sc("s09","The monks' answer was not to fight harder. It was to stay. Don't argue with the urge. Don't obey it either. Notice it, and put your hands back on the work.",
   ph("monk-prayer","it was / to ~stay~","r",focus="35% 30%"))
sc("s10","William James, the father of American psychology, called this the whole game. The faculty of voluntarily bringing back a wandering attention, over and over again, is the very root of judgment, character, and will.",
   ph("weyden-prayer",focus="40% 30%",sub="faculty",cite="William James, The Principles of Psychology (1890)"))
sc("s11","Read that again. Not never wandering. Bringing it back. A focused mind is not one that never leaves. It is one that has learned the way home.",
   ph("olivetan-monk","the way / ~home~","r",focus="35% 30%"))

card("ch2",card="chapter",num="two",title="one ~arrow~",len=4.0)
sc("s12","A mind with ten urgent goals has none. You can want money, strength, skill, respect and freedom. Wanting is fine. The mistake is giving all of them the same hour.",
   ph("greco-jerome","ten goals / _has_ ~none~","l",focus="60% 30%"))
sc("s13","The Buddha used the picture of a craftsman. As a fletcher makes straight his arrow, a wise man makes straight his trembling and unsteady thought, which is difficult to guard, difficult to hold back.",
   ph("troyon-road",kb="up",focus="50% 50%",sub="as",cite="The Dhammapada, verse 33 · translated by F. Max Müller"))
sc("s14","An arrow has one point. So each morning, before the world gets a vote, choose the one piece of work that would matter most if it moved today. Not the pleasant one. Not the one that only looks busy.",
   ph("seurat-gardener","^one^ / ~point~","tl",focus="60% 50%"))
sc("s15","Then write it so plainly that you can't hide from it. Not: get ahead. Write: finish this chapter. Send this proposal. Practise this piece for forty minutes. A vague goal leaves you room to escape. A clear one closes the door.",
   ph("neer-reader","~finish~ / this ^chapter^","r",focus="30% 40%"))
sc("s16","And when someone else's urgency arrives, a message, a debate, a trend that will be dead by Friday, ask one question. Can this wait an hour? It almost always can.",
   ph("fragonard-letter","can this / ~wait~","l",focus="65% 40%"))

card("ch3",card="chapter",num="three",title="the ~cell~",len=4.0)
sc("s17","There is an old saying from the desert. Go, sit in your cell, and your cell will teach you everything.",
   ph("hammershoi-moonlight","sit / in your ~cell~","l",focus="50% 50%"))
sc("s18","A cell is a bare room. A bed, a table, a book, a window. The monk does not rely on willpower to ignore the market, because the market is not in the room.",
   ph("granet-choir","the market / is _not_ in / the ~room~","tl",focus="50% 60%"))
sc("s19","You do the opposite. You put the whole market on your desk, and then blame yourself for looking at it. That is not weakness. It is bad design.",
   ph("fish-market","bad / ~design~","tr",kb="left",focus="50% 50%"))
sc("s20","So build a cell. Phone in another room. Notifications off, except from the people who truly need you. One window open on the screen. A clear table. None of it is heroic. All of it works.",
   ph("carus-gothic","build / a ~cell~","l",focus="60% 50%"))
sc("s21","Blaise Pascal saw why it is so hard. I have discovered that all the unhappiness of men arises from one single fact, that they cannot stay quietly in their own chamber.",
   ph("latour-magdalen",focus="50% 40%",sub="i",cite="Blaise Pascal, Pensées, 139 · translated by W. F. Trotter"))
sc("s22","The first minutes in a quiet room feel like something is missing. Nothing is missing. That is your mind coming down from the noise. Stay through it.",
   ph("cezanne-dominique","~nothing~ / is missing","r",focus="35% 35%"))

card("ch4",card="chapter",num="four",title="the ~bell~",len=4.0)
sc("s23","In a monastery, nobody decides when to begin. A bell rings, and everyone begins.",
   ph("thayer-monadnock","a ~bell~ / ^rings^","tl",focus="50% 50%"))
sc("s24","Saint Benedict built his Rule, the one that shaped monastic life in the West, around this idea. Idleness is the enemy of the soul. Therefore the brethren should be occupied at certain times in manual labor, and again at fixed hours in sacred reading.",
   ph("barocci-francis",focus="60% 30%",sub="idleness",cite="The Rule of Saint Benedict, chapter 48 · translated by Leonard J. Doyle"))
sc("s25","Certain times. Fixed hours. The monk does not ask each morning whether he feels like it. The question was settled long ago, so none of his strength is spent on deciding.",
   ph("ruysdael-road","~fixed~ / ^hours^","tr",kb="left",focus="50% 60%"))
sc("s26","Take that for yourself. Pick your hour, the same one each day, before messages and headlines if you can. The night before, set out the work. Know the first move.",
   ph("kensett-twilight","pick / your ~hour~","tl",focus="50% 60%"))
sc("s27","When the hour comes, don't wait to feel ready. Ready comes after you begin, not before. Put your hands on the work, and let the mood catch up.",
   ph("isola-bella","ready comes / _after you_ / ~begin~","tr",focus="50% 60%"))
sc("s28","One guarded hour, kept every day, will carry you further than a whole day of scattered effort.",
   ph("lake-george","^one^ / guarded / ~hour~","r",focus="40% 50%"))

card("ch5",card="chapter",num="five",title="the ~kitchen~",len=4.0)
sc("s29","In the sixteen hundreds, a monk in Paris named Brother Lawrence was given the job nobody wanted. The kitchen. Noise, heat, and people shouting for different things at once.",
   ph("wtewael-kitchen","the / ~kitchen~","tl",kb="right",focus="50% 40%"))
sc("s30","And this is what he said about it. The time of business does not with me differ from the time of prayer. In the noise and clutter of my kitchen, while several persons are at the same time calling for different things, I possess God in as great tranquillity as if I were upon my knees at the Blessed Supper.",
   ph("sorgh-kitchen",focus="50% 50%",sub="the#2",cite="Brother Lawrence, The Practice of the Presence of God (1692)"))
sc("s31","He had not escaped the noise. He had learned to give his whole attention to the one thing in his hands, and that turned out to be enough.",
   ph("kalf-kitchen","the one thing / in his ~hands~","l",focus="50% 50%"))
sc("s32","This is where focus is really tested. Anyone can concentrate while a thing is new. Then the newness wears off, and the work becomes the same motion, again.",
   ph("millet-rake","the ~same~ / motion / ^again^","l",focus="55% 35%"))
sc("s33","Most people leave at that point. They don't quit. They just start something fresh, and call it ambition.",
   ph("cezanne-cards","_and_ call it / ~ambition~","tl",focus="50% 40%"))
sc("s34","The monk stays in the dull middle. And the dull middle is exactly where skill is made.",
   ph("cezanne-peasant","the dull / ~middle~","l",focus="55% 30%"))

card("ch6",card="chapter",num="six",title="the ~weather~",len=4.0)
sc("s35","You can silence every device and still lose the day to something you carry inside. A grudge. An insult. Envy. One careless remark can rent your head for hours.",
   ph("keith-storm","something / you carry / ~inside~","tl",kb="right",focus="50% 50%"))
sc("s36","The Buddhist texts give the answer in a single line. As a solid rock is not shaken by the wind, wise people falter not amidst blame and praise.",
   ph("richards-rocky",kb="left",focus="50% 50%",sub="as",cite="The Dhammapada, verse 81 · translated by F. Max Müller"))
sc("s37","A rock feels the wind. It just doesn't go anywhere. You don't need to feel nothing. You need to stop letting each feeling grab the wheel.",
   ph("homer-mainecoast","a ^rock^ / ~feels~ / the wind","tl",focus="50% 55%"))
sc("s38","So when anger or envy rises, ask one cold question. Does acting on this serve the work? If not, name it, let it pass through, and go back.",
   ph("goes-man","does this / ~serve~ / the work","r",focus="40% 30%"))
sc("s39","Feelings are weather. Your work is the ground.",
   ph("homer-woodisland","feelings are / ~weather~","tl",focus="50% 60%"))

card("ch7",card="chapter",num="seven",title="the ~return~",len=4.0)
sc("s40","Here is the part most people get wrong. They think a focused person never drifts. Monks drift constantly. Ask any of them.",
   ph("corot-reading","monks / ~drift~","l",focus="65% 35%"))
sc("s41","Brother Lawrence admitted that for years his mind wandered in prayer, again and again. His whole method was simply to come back. No drama. No self-punishment. Back.",
   ph("wilson-nemi","come / ~back~","tl",focus="50% 55%"))
sc("s42","So when you slip, and you will, don't turn one lost minute into a lost day. Beating yourself up is just another way of not working.",
   ph("conesus","one lost / ~minute~","tr",kb="left",focus="50% 55%"))
sc("s43","The Dhammapada says it without softness. If one man conquer in battle a thousand times thousand men, and if another conquer himself, he is the greatest of conquerors.",
   ph("vivarini-jerome",focus="50% 25%",sub="if",cite="The Dhammapada, verse 103 · translated by F. Max Müller"))
sc("s44","Give yourself rest as well. Monks sleep, eat, walk and keep silence on a schedule, because a tired mind cannot hold anything. Rest is part of the rule, not a break from it.",
   ph("lake-squam","~rest~ / is part / of the rule","tl",focus="50% 55%"))
sc("s45","Do this for a few months, and something changes. The work that needed all your strength starts to feel ordinary. People will say you are gifted, or lucky, or calm by nature.",
   ph("bierstadt-mountain","calm / by ~nature~","tl",focus="50% 50%"))
sc("s46","You will know better. You closed the door. You chose one arrow. You kept your hour. You stayed through the dull middle, and you came back every time you left.",
   ph("hobbema-road","you ~came~ / ^back^","tl",kb="right",focus="50% 55%"))
sc("s47","So tonight, don't look for more motivation. Choose one task. Remove one distraction. Guard one hour. Then do it again tomorrow.",
   ph("castiglione-francis","one task / one ~hour~","l",focus="70% 35%"))
sc("s48","That is all a monk's focus has ever been. Not a gift. A room, a bell, and the habit of coming back.",
   ph("reading-scriptures","a room / a ~bell~ / _and_ coming ^back^","l",focus="60% 40%"))
card("end",card="end",len=9.0)

# ---- scenes added to reach 15 minutes; each goes in after the scene named first ----
X=[]
def ins(after,i,text,*vis): X.append((after,{"id":i,"text":text,"visuals":list(vis)}))
ins("s03","s03b","And the world is built to keep it that way. Every screen you own was designed by clever people whose job is to pull your eyes back. You are not weak for losing to them. But you will keep losing until you change the terms.",
   ph("court-amusement","change / the ~terms~","tl",kb="right",focus="50% 50%"))
ins("s09","s09b","This matters more than it sounds. Every time boredom leads to scrolling, your mind learns that boredom means scroll. Every time it leads back to the work, it learns that instead. You are always training. The only question is what.",
   ph("sargent-hermit","you are / ~always~ / ^training^","tl",focus="50% 60%"))
ins("s11","s11b","So start small enough to win. Twenty minutes. One task. When the pull comes, and it will come inside the first five, let it stand there while your hands keep moving. You do not have to believe every thought you think.",
   ph("sleeping-girl","small enough / to ~win~","tl",focus="50% 45%"))
ins("s15","s15b","The same old book lists four trades. Well-makers lead the water wherever they like; fletchers bend the arrow; carpenters bend a log of wood; wise people fashion themselves.",
   ph("michel-field",kb="right",focus="50% 60%",sub="well-makers",cite="The Dhammapada, verse 80 · translated by F. Max Müller"))
ins("s16","s16b","People who are always reachable are rarely formidable. Being slow to answer is the price of doing anything that takes thought. Pay it.",
   ph("longhi-letter","slow / to ~answer~","tr",focus="50% 60%"))
ins("s20","s20b","Then look at the quieter clutter. The five projects you started. The new plan that arrives every Monday. Each new beginning feels like progress, and saves you from the hard part of the old one. Before you add anything, ask what it will push out.",
   ph("meissonier-cards","what it will / ~push~ ^out^","tl",focus="55% 45%"))
ins("s22","s22b","This is not about cutting people off. Monks live in community. They eat together, work together, care for the sick. The cell is not a wall against others. It is a door you are allowed to close for an hour.",
   ph("hooch-visit","a ~door~ / you are allowed / to ^close^","tr",focus="40% 55%"))
ins("s28","s28b","Protect the edges of it too. When the hour ends, leave yourself a note: where you stopped, and what comes next. Tomorrow you begin from that line, not from zero.",
   ph("winter-holland","not / from ~zero~","tl",focus="50% 55%"))
ins("s34","s34b","So when the excitement goes, read it correctly. It does not mean you chose the wrong path. It usually means you have finally reached the real work. Break it into smaller pieces. Ask a better question. But stay at the table.",
   ph("cards-drawingroom","the ~real~ / ^work^","tl",focus="55% 50%"))
ins("s39","s39b","And be careful with the wish to be seen. The moment you want to look disciplined more than you want to be disciplined, your attention has left the work again and gone to the audience. Let the results speak. They take longer, and they last.",
   ph("seurat-sideshow","let the / ~results~ / speak","tl",focus="50% 50%"))
ins("s42","s42b","Instead, look at what pulled you away. Was the phone in reach? Was the task too vague? Fix that one thing, and begin again.",
   ph("corot-letter","~begin~ / again","r",focus="35% 35%"))
ins("s44","s44b","And once a week, look back honestly. What moved forward? What kept interrupting? What one change would make next week better? Monks call this examination. You can call it Sunday.",
   ph("market-scene","what ~moved~ / ^forward^","tl",kb="left",focus="50% 50%"))
ins("s45","s45b","Nothing mystical happened. A habit repeated long enough stops feeling like effort, and starts feeling like who you are. That is what calm looks like from the inside.",
   ph("evening-lake","who / you ~are~","tl",focus="50% 60%"))
for after,sc_ in X:
    k=[x["id"] for x in S].index(after); S.insert(k+1,sc_)
json.dump({"voice":"bm_george","speed":0.86,"gap":0.55,"scenes":S},open("src/scenes.json","w"),indent=1,ensure_ascii=False)
import collections,os
print("scenes",sum(1 for s in S if "text" in s),"words",sum(len(s["text"].split()) for s in S if "text" in s))
used=[v["photo"] for s in S for v in s.get("visuals",[]) if "photo" in v]
print("dupes",[k for k,c in collections.Counter(used).items() if c>1],"missing",[k for k in used if not os.path.exists(f"assets/photos/{k}.jpg")])
print("unused",sorted(set(f[:-4] for f in os.listdir("assets/photos"))-set(used)))
