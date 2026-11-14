# Writes src/scenes.json: the script, the picture for each scene, and its captions.
# Every spoken line is captioned automatically (src/build.mjs), except on book pages (page "q-...") and the study card.
# Optional per visual: stack (hand-written caption: " / " new line, ~script~, ^big^, _small_), pos, behind (a word shown
# huge behind the figure), label (a name).
import json, collections, os
S=[]
def sc(i,text,*vis): S.append({"id":i,"text":text,"visuals":list(vis)})
def card(i,**k): S.append({"id":i,**k})
def ph(p,stack=None,pos="tl",kb="in",focus="50% 40%",**k):
    v={"photo":p,"kb":kb,"focus":focus,"pos":pos,**k}
    if stack: v["stack"]=stack
    return v
def pg(p,cut=None,**k): return {"page":p,**({"cut":cut} if cut else {}),**k}

sc("s01","I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.", pg("q-walden1"))
sc("s02","Henry David Thoreau wrote that in eighteen fifty-four. Discover that I had not lived. Read it slowly, because it is easy to nod at, and hard to feel.",
   ph("thoreau",focus="50% 30%",framed=True,stack="i had ~not~ ^lived^"))
sc("s03","So let's make it feel like something. It's a Wednesday evening. You pull into the driveway, turn off the engine, and you don't get out. Not yet.",
   ph("victorian-house",kb="right",focus="50% 50%"))
sc("s04","You sit there for five more minutes, with the radio off, staring at nothing.",
   ph("man-steps",pos="tr",focus="50% 70%"))
sc("s05","Nothing is wrong, exactly. There is a job, a house, people who are glad to see you. If someone asked, you would say things are good.",
   ph("women-sitting",focus="50% 50%"))
sc("s06","And they are good. That's what makes it hard to explain. Underneath all of it there is one quiet thought you never say out loud. Is this it?",
   ph("christabel",focus="50% 30%",behind="quiet"))
sc("s07","Then the five minutes are up. You go inside, eat, look at your phone until late, and tell yourself it will get better once things settle down.",
   ph("moon",pos="l",focus="50% 50%",kb="out"))
sc("s08","Things never settle down. Next Wednesday, you are back in the car.",
   ph("broadway-rain",focus="50% 50%",kb="left"))
sc("s09","If that sounds familiar, you need to hear something first. You are not ungrateful, and you are not broken. You are in very old company.",
   ph("crowd-august",focus="50% 50%"))
sc("s10","More than a hundred years ago, one of the greatest writers who ever lived wrote a whole story about a man in exactly your seat.",
   ph("bookcase",focus="50% 50%"))
card("title",card="title",len=6.0)

card("ch1",card="chapter",num="one",title="the most ~ordinary~ life",len=4.0)
sc("s11","In eighteen eighty-six, Leo Tolstoy published a short novel called The Death of Ivan Ilyitch. It opens with a funeral, and then, in one sentence, it tells you the whole problem.",
   ph("tolstoy",pos="tr",focus="40% 35%",label="Leo Tolstoy"))
sc("s12","The previous history of Ivan Ilyitch was the simplest, the most ordinary, and the most awful.", pg("q-ivan1"))
sc("s13","Ivan Ilyitch was not a bad man. He was a successful one. A judge. A good salary, a good marriage on paper, an apartment he decorated with great care.",
   ph("brady-man",focus="50% 25%",behind="judge"))
sc("s14","At every step, he did what sensible people were supposed to do. He was respected, and he was comfortable, and he was proud of both.",
   ph("staircase",pos="tr",focus="50% 40%"))
sc("s15","Then he fell ill. And lying awake at night, at forty-five, a thought came to him that he had never once allowed himself to think.",
   ph("evening",focus="50% 50%"))
sc("s16","What if in reality all my life, my conscious life, has been not the right thing?", pg("q-ivan2"))
sc("s17","Tolstoy describes what comes next with terrible precision. Ivan remembers small moments when something in him had pushed back. Little impulses, quickly dismissed, against what was considered good by persons of higher position.",
   ph("man-reading-study",pos="tl",focus="60% 40%"))
sc("s18","He had ignored every one of them. And now he wonders if they were the only real thing in his life.",
   ph("young-man-2",focus="50% 25%",behind="real"))
sc("s19","Sit with that for a second, because it is the uncomfortable center of this whole video. Ivan Ilyitch didn't fail. He won. He won every game he was handed. It just wasn't his game.",
   ph("stiff-pull",focus="50% 50%",stack="wasn't / ~his~ ^game^"))

card("ch2",card="chapter",num="two",title="the world's ~opinion~",len=4.0)
sc("s20","So how does a capable man end up building a life he doesn't want? Ralph Waldo Emerson answered in eighteen forty-one, in an essay called Self-Reliance.",
   ph("emerson",focus="50% 30%",behind="emerson"))
sc("s21","It is easy in the world to live after the world's opinion; it is easy in solitude to live after our own; but the great man is he who in the midst of the crowd keeps with perfect sweetness the independence of solitude.", pg("q-emerson1"))
sc("s22","Look at the order of his words. It is easy to live after the world's opinion. Not hard. Easy. That is the trap.",
   ph("crowd-recreation",focus="50% 50%",kb="left",stack="not hard / ^easy^"))
sc("s23","Nobody forces you into the wrong life. You drift into it, one reasonable choice at a time, because each choice was the one that people around you approved of.",
   ph("rowing-home",focus="50% 50%",stack="you ~drift~ / into it"))
sc("s24","The degree your parents could explain to their friends. The job that sounded good at dinner parties. The car, the neighborhood, the picture of success you absorbed long before you could argue with it.",
   ph("classroom",focus="50% 40%"), ph("paris-street",cut="car",kb="right",focus="50% 50%"))
sc("s25","Very little of it was chosen in silence. Most of it was handed to you, and you said thank you.",
   ph("soiree",focus="50% 25%",behind="handed"))
sc("s26","Emerson had a harder line for it. There comes a time, he wrote, when a man arrives at the conviction that envy is ignorance; that imitation is suicide.",
   ph("painter-studio",pos="tr",focus="50% 50%"), pg("q-emerson2",cut="arrives"))
sc("s27","Imitation is suicide. Not because copying is a sin, but because every hour spent living someone else's life is an hour taken from your own.",
   ph("bridge-people",focus="50% 50%",kb="right"))
sc("s28","And the strange thing about a borrowed life is that it never satisfies, even when it works. You finally get the promotion, the house, the number in the account, and you feel almost nothing. You've climbed a mountain someone else picked.",
   ph("pioneer-cabin",focus="50% 60%"), ph("mirror-lake",cut="climbed",focus="50% 50%",stack="a mountain / someone ~else~ picked"))

card("ch3",card="chapter",num="three",title="whose ~voice~",len=4.0)
sc("s29","So here is an exercise worth more than most advice you'll ever hear. Take a piece of paper, and write down five things you want right now. Big or small. A title, an income, a body, a place to live, a thing to own.",
   ph("woman-writing",focus="50% 30%",behind="paper"))
sc("s30","Then next to each one, write down whose voice you hear when you want it. Be honest.",
   ph("old-tom",focus="50% 30%",behind="voice"))
sc("s31","Is it your father's voice? An old teacher's? The friend who always seemed a step ahead? A stranger online, whose life you have watched for years?",
   ph("man-courtyard",focus="50% 50%"))
sc("s32","Some of the wants will have your own voice next to them. Keep those. Guard them. The others are worth a second look.",
   ph("farm-buildings",focus="50% 50%",kb="left"))
sc("s33","They may still be worth having. But you should know that you are carrying them for someone else.",
   ph("harbor",focus="40% 50%",stack="carrying them / for someone ~else~"))

card("ch4",card="chapter",num="four",title="the regrets that ~last~",len=4.0)
sc("s34","And this is where the research becomes uncomfortable. In twenty eighteen, the psychologists Shai Davidai and Thomas Gilovich published a paper with a beautiful title. The Ideal Road Not Taken.",
   ph("village-road",focus="50% 50%",stack="the ideal ^road^ / not ~taken~"))
sc("s35","Across six studies, they asked people about their regrets, and they sorted those regrets into two kinds.",
   ph("stamford-road",kb="right",focus="50% 50%"))
sc("s36","The first kind is about duties. The things you should have done. The phone call to your mother. The promise you broke.",
   ph("mill",focus="50% 50%"))
sc("s37","The second kind is about ideals. The person you hoped to become. The book you meant to write. The life you once pictured for yourself.",
   ph("pond-bridge",focus="50% 50%"))
sc("s38","What they found was striking. People's most enduring regrets came more often from the second kind. Not from failing their duties, but from failing their ideals.", pg("study"))
sc("s39","And they found a reason. When we fall short of a duty, we tend to act. We apologize, we repair it, we make the call. But when we fall short of an ideal, we postpone. There's always next year.",
   ph("wood-scene",focus="50% 50%"))
sc("s40","So the duty regrets get resolved, and the ideal regrets stay open. For decades.",
   ph("tree-study",focus="50% 50%",stack="for ^decades^"))
sc("s41","Which means the thing you keep putting off is not a small thing. It is exactly the kind of thing you will still be thinking about at the end. Ivan Ilyitch didn't lie awake regretting a missed appointment. He lay awake regretting a life.",
   ph("fontainebleau",focus="50% 50%"))

card("ch5",card="chapter",num="five",title="live ~deliberately~",len=4.0)
sc("s42","So how do you find the life you actually want? Not with a fantasy. Most men, when they picture a different life, picture an escape. A beach. A huge win. A world with no responsibilities.",
   ph("wherries",focus="50% 50%",kb="right"))
sc("s43","But nobody lives on a beach. Life happens on Wednesdays, in parked cars, in the hours between work and sleep.",
   ph("men-carriage",focus="50% 50%"))
sc("s44","Look again at what Thoreau actually did. He didn't run away from the world forever. He built a small house by a pond, a short walk from town, and lived there as an experiment. In his own words, I lived there two years and two months. Then he came back.",
   ph("cabin-round",focus="50% 50%"), ph("water-lilies-gather",cut="words",focus="50% 50%"))
sc("s45","The experiment had one rule, and he put it in one word.",
   ph("water-lilies",focus="50% 50%",stack="one ~rule~"))
sc("s46","Simplicity, simplicity, simplicity! I say, let your affairs be as two or three, and not a hundred or a thousand.", pg("q-simplicity"))
sc("s47","That is something you can steal. You don't need a cabin. You need an experiment. Pick one part of your life. Your mornings, your evenings, your work, your weekends.",
   ph("forest-path",focus="50% 50%",stack="you need / an ~experiment~"))
sc("s48","For thirty days, run it deliberately. Strip it down to the two or three things you would choose if no one were watching. Fewer obligations, fewer people, more of what actually matters to you.",
   ph("oak-forest",focus="50% 50%",kb="right",stack="for ~thirty~ ^days^"))
sc("s49","At the end of thirty days, look at what happened. Not at how it looked. At how it felt to live it. Keep what was true. Drop what wasn't. Then pick the next part.",
   ph("fontainebleau-2",focus="50% 50%"))
sc("s50","The wrong life wasn't built in one decision. It was built one ordinary day at a time. The right one is built the same way.",
   ph("upper-lake",focus="50% 50%",stack="one ordinary / ^day^ at a ~time~"))

card("ch6",card="chapter",num="six",title="several more ~lives~",len=4.0)
sc("s51","And there is one more thing Thoreau wrote, almost in passing, that most people skip. When he explained why he left the pond, he said this.",
   ph("suspension-bridge",focus="50% 50%"))
sc("s52","I left the woods for as good a reason as I went there. Perhaps it seemed to me that I had several more lives to live, and could not spare any more time for that one.", pg("q-lives"))
sc("s53","Several more lives to live. He was barely thirty, and he already understood something most people never do. You don't get one life with one chance to choose it. You get many chapters, and each one can be chosen again.",
   ph("flooded-road",focus="50% 50%",stack="several more / ^lives^"))
sc("s54","The feeling that it's too late is the most convincing lie a man ever tells himself. It sounds like realism. It sounds like maturity. It is usually just fear, dressed up as wisdom.",
   ph("old-beggar",focus="50% 25%",behind="fear"))
sc("s55","Ivan Ilyitch's question came to him at the very end, when there was almost nothing left to do with it. Yours didn't. If you're watching this, the question has come early. That is not a crisis. That is a gift.",
   ph("road-singapore",focus="50% 50%",stack="that is / a ~gift~"))
sc("s56","So the next time you're sitting in that parked car, with the engine off and the radio quiet, don't just wait for the feeling to pass. Ask it a question.",
   ph("approach",focus="50% 50%"))
sc("s57","What would a deliberate life look like, starting with tomorrow morning? Then go inside, and take one small step toward it before you sleep.",
   ph("morning-after",focus="50% 40%"))
sc("s58","Thoreau went to the woods so that, when he came to die, he would not discover that he had not lived. You don't need the woods. You need to stop living after the world's opinion, one ordinary day at a time.",
   ph("old-dominion",focus="50% 50%"))
sc("s59","Live deliberately. Starting now.",
   ph("desert-lake",focus="50% 50%",stack="live / ~deliberately~"))
card("end",card="end",len=9.0)
json.dump({"voice":"bm_george","speed":0.86,"gap":0.55,"scenes":S},open("src/scenes.json","w"),indent=1,ensure_ascii=False)
print("scenes",sum(1 for s in S if "text" in s),"words",sum(len(s["text"].split()) for s in S if "text" in s))
used=[v["photo"] for s in S for v in s.get("visuals",[]) if "photo" in v]
print("dupes",[k for k,c in collections.Counter(used).items() if c>1],"missing",[k for k in used if not os.path.exists(f"assets/photos/{k}.jpg")])
print("unused",sorted(set(f[:-4] for f in os.listdir("assets/photos"))-set(used)))
