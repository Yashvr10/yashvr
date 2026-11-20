# Second pass: the themes added with chapter IV, plus more faces (the most used theme) and India (none found first time).
src = open("src/commons.py").read()
a = src.index("Q = {"); b = src.index("\ndef api", a)
extra = 'Q = {"insect": ["Merian metamorphosis plate", "butterfly painting", "Jan van Kessel butterflies"], "seed": ["oak branch acorns painting", "sower painting Millet"], "sage": ["Laozi riding ox painting", "Chinese hermit painting mountain"], "night": ["nocturne painting", "starry night painting 19th century"], "thinker": ["philosopher painting Rembrandt", "Democritus painting"]}\n'
exec(src[:a] + extra + src[b:])
