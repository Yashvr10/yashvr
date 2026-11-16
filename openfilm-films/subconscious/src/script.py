# Writes src/scenes.json for the self-hypnosis film. Narration = the user's script, one clip per sentence, so the gaps
# between sentences can be set to the reference reel's pace (tight gaps, one long hold after the hook).
# Script changes (YouTube, not a newsletter): "on my Substack" -> "on this channel", "these letters" -> "these lessons";
# typo fixed: "You require confidence and floods you with certainty. you." -> "... and it floods you with certainty."
#
# Per sentence:
#   th    image themes for the shots (src/images.json pools), cycled; the build cuts every ~1.2 s on word starts
#   emph  words shown huge (white Bebas on black), one at a time, as they are spoken
#   grid  a light grey collage card: images pop in one per beat around the caption (value = theme)
#   grey  the caption alone, black on the light grey card
#   burst a run of 2-frame cuts at the start of the sentence
#   gap   silence after the sentence (s); default 0.22
import json
S = []
def s(text, th, emph=(), grid=None, grey=False, burst=False, gap=0.15):
    S.append(dict(id=f"s{len([x for x in S if 'text' in x])+1:02d}", text=text, th=th if isinstance(th, list) else [th],
                  emph=list(emph), grid=grid, grey=grey, burst=burst, gap=gap))
def ch(a, b, dur=2.6): S.append(dict(id=f"ch{sum(1 for x in S if 'card' in x)+1}", card="chapter", a=a, b=b, len=dur))

s("You know what would change your life if you started doing it tomorrow morning and yet an invisible force paralyses you into procrastination.",
  ["dawn", "bed", "chains"], burst=True, gap=0.15)
ch("SELF", "HYPNOSIS")
s("As a matter of fact, what you call a lack of discipline is a sign you lack authority within your mind.", ["head", "king"], emph=["authority"])
s("You do not trust yourself, and so you resort to force, to obedience, to whipping yourself into shape.", ["mirror", "chains"], emph=["force", "obedience"])
s("This creates resistance and if you're ambitiously minded, you'll revolt against it.", ["storm", "revolt"])
s("You probably already know this but I'm going to say it anyway so your subconscious mind can hear it loud and clear.", ["head", "ear"], grey=False)
s("The solution is seduction", ["seduce"], emph=["seduction"], gap=0.35)
s("To seduce your mind with your goals, your vision, your to-do list and allow yourself to naturally move towards them.", ["seduce"], grid="goals")
s("Willpower is then used as nitrous.", ["speed"], emph=["nitrous"])
s("A boost here and there.", ["speed"])
s("This is the fundamental principle of self-hypnosis.", ["hypno"])
s("This is what I will teach you over the coming months on this channel.", ["reading"])
s("You don't realise it yet, but after consistent practice of what I share with you this week, you'll begin to feel for perhaps the first time in years as if your mind is on your side.",
  ["walk", "calm", "head"], emph=["side"])
ch("PERSONAL", "QUESTION")
s("When was the last time your subconscious actually listened to you?", ["head"], grey=True)
s("When you asked it to be calm, did it calm?", ["calm"])
s("When you required confidence, did it deliver?", ["king"])
s("When you needed sleep did it grant it, or did it spend three hours interrogating you about something that happened in 2017?", ["bed", "night", "clock"], emph=["2017"])
s("If you're like most, the answer is uncomfortable.", ["face"], emph=["uncomfortable"])
s("Your subconscious never listens because you fail to speak to it with respect.", ["talk", "head"], emph=["respect"])
s("Just imagine what it would be like if that changed.", ["dawn"])
ch("BEING", "HEARD")
s("Picture yourself with a mind that hears you.", ["ear", "head"])
s("Just imagine for a moment, your thoughts respected, your ideas valued, your reassurance immediately soothing doubt.", ["face"], grid="minds")
s("You will retain a clear image of what it feels like to laugh at comparing yourself to others, because the comparison no longer holds you.", ["laugh", "crowd"])
s("As you continue to picture this, realise this is how your mind is supposed to work.", ["calm", "head"])
s("When your subconscious respects you, it listens, and it executes.", ["king", "speed"], emph=["listens", "executes"], burst=True)
s("You ask to fall asleep and it hears you.", ["bed"])
s("You require confidence and it floods you with certainty.", ["king"], emph=["certainty"])
s("You feel out of your depth and it reminds you of why you're not.", ["sea", "walk"])
s("With every passing minute you practice this, the channel between you and your deeper mind opens further.", ["door", "sea"], emph=["further"])
s("Now, just imagine what would happen if we applied this to every area of your life.", ["crowd"], grid="life")
s("What would you now be able to do?", ["dawn"], grey=True, gap=0.3)
ch("FIRST", "FOCUS")
s("To begin with, our first focus is to learn how to relax your mind.", ["calm"], emph=["relax"])
s("Concentration of mind is a fundamental skill.", ["reading", "candle"])
s("Every other skill whether self-hypnotic or real-world is a product of concentration.", ["work"], grid="work")
s("Without doubt, this is the root.", ["tree"], emph=["root"])
s("Picture this for a moment", ["face"], gap=0.3)
s("The presence in your eyes as you look into a room you speak to.", ["eyes", "talk"])
s("The poised attention as you handle a difficult conversation.", ["talk"])
s("What you focus on, you realise more of and see more often until it becomes the focal point of your daily experience.", ["eyes", "street", "candle"])
s("The more you practice, the more control you have over anxiety, fear and panic in real situations.", ["storm"], emph=["anxiety", "fear", "panic"])
s("You are able to physiologically calm your nervous system through the persuasion of your own thought.", ["calm", "head"])
s("Little by little, you learn to tame the seductive nature of negative thoughts.", ["seduce", "night"])
s("Which can be difficult, because we live in a world of distraction.", ["street", "crowd"], emph=["distraction"], burst=True)
s("This is why we treat these lessons as sacred.", ["candle"], emph=["sacred"])
s("We listen. We understand and we act upon them.", ["reading", "work"])
s("You must master this first. Without it, you refuse the fundamentals of learning to communicate with yourself.", ["head", "mirror"])
s("In order of progression, each week you'll become more and more authoritative over your own autonomy.", ["walk", "king"])
s("With this in mind are you ready to learn how to regain control of your mind?", ["eyes", "head"], emph=["control"], gap=0.8)
json.dump(dict(voice="bm_george", speed=1.33, scenes=S), open("src/scenes.json", "w"), indent=1)
print(len([x for x in S if "text" in x]), "sentences,", sum(len(x["text"].split()) for x in S if "text" in x), "words")
