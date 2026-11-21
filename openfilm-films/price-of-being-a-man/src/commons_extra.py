# Second pass: more pictures for the most-used themes and the ones left thin after removing frames, photos and sketches.
src = open("src/commons.py").read()
a = src.index("Q = {"); b = src.index("\ndef api", a)
extra = '''Q = {"sunrise": ["sunrise landscape painting 19th century", "dawn painting Aivazovsky", "morning sun painting mountains", "sunrise sea painting"],
 "labourer": ["Millet peasant working painting", "porter carrying painting", "Courbet stone breakers", "farmer ploughing painting", "woodcutter painting", "dock workers painting"],
 "knight": ["knight armour portrait painting dark", "crusader painting", "Templar knight painting"],
 "face": ["portrait of a man Rembrandt", "Velazquez portrait man", "portrait of a man Titian"],
 "wanderer": ["Friedrich man walking landscape", "traveller with staff painting", "man walking alone road painting"],
 "road": ["country road painting 19th century", "mountain road painting"],
 "mason": ["building cathedral painting", "quarry workers painting"],
 "father": ["father son painting 19th century", "fisherman and son painting"],
 "sword": ["sword painting knight kneeling", "Excalibur painting"],
 "mirror": ["man reflection water painting", "Narcissus painting"],
 "lion": ["lion resting painting", "lion Landseer"],
 "monk": ["monk by the sea Friedrich", "Saint Jerome in his study painting", "hermit praying cave painting"],
 "funeral": ["burial painting 19th century", "mourners painting"],
 "window": ["man looking out window painting 19th century"],
 "insect": ["caterpillar butterfly painting"]}
'''
exec(src[:a] + extra + src[b:])
