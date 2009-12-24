default: taglib

taglib:
	cd deps/taglib
	node-waf configure build

clean: doc-clean


doc-clean:
	rm doc/*.{xml,html}

doc: doc/install doc/index

doc/install:
	a2x doc/install.txt

doc/index:
	a2x doc/index.txt
