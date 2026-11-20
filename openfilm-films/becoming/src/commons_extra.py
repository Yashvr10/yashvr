# Second pass for the themes added with chapter IV (run after src/commons.py).
import re
src = open("src/commons.py").read()
a = src.index("Q = {"); b = src.index("\n}\n", a) + 3
extra = 'Q = {"nurse": ["nurse at bedside painting", "sickbed painting 19th century", "the sick room painting"], "painter": ["painter at easel painting", "artist in studio painting 19th century", "landscape painter outdoors painting"]}\n'
exec(src[:a] + extra + src[b:])
