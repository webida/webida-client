import shutil, os, glob

gitpath = "CodeMirror"

# git clone https://github.com/marijnh/CodeMirror.git
# cd CodeMirror
# git checkout <<version name e.g. v3.12>>
# cd ..
# python importcm.py

# shutil.copyfile(gitpath + "/lib/codemirror.css", "codemirror.css")

shutil.rmtree("theme", True)
shutil.copytree(gitpath + "/theme", "theme")

try:
    os.mkdir("lib")
except:
    pass
f = open(gitpath + "/lib/codemirror.js", "rt")
lines = f.readlines()

print lines[0]
print lines[1]
print lines[-2]
print lines[-1]

if lines[0] == "// CodeMirror is the only global var we claim\n" and \
   lines[1] == "window.CodeMirror = (function() {\n" and \
   (lines[-1] == "})();\n"):
    w = open("lib/codemirror.js", "wt")
    w.write(lines[0])
    w.write("define(function() {\n")
    for i in lines[2:-1]:
        w.write(i)
    w.write("});\n")
    w.close()
else:
    print "Error while copying codemirror.js"
    exit(1)


shutil.rmtree("mode", True)
shutil.copytree(gitpath + "/mode", "mode")

def modulize(filepath):
    f = open(filepath, "rt")
    lines = f.readlines()
    f.close()
    f = open(filepath, "wt")
    f.write("define(['lib/codemirror/lib/codemirror'], function(CodeMirror) {\n");
    for i in lines:
        f.write(i)
    f.write("});");
    f.close()

for p in os.listdir("mode"):
    if os.path.isdir(os.path.join("mode", p)):
        dirpath = os.path.join("mode", p)
        filepath = os.path.join(dirpath, p + ".js")
        if os.path.exists(filepath):
            modulize(filepath)
        else:
            for s in os.listdir(dirpath):
                filepath = os.path.join(dirpath, s, s + ".js")
                modulize(filepath)



shutil.rmtree("addon", True)
shutil.copytree(gitpath + "/addon", "addon")

for p in glob.glob("addon/*/*.js"):
    modulize(p)

shutil.rmtree("keymap", True)
shutil.copytree(gitpath + "/keymap", "keymap")

for p in glob.glob("keymap/*.js"):
    modulize(p)
