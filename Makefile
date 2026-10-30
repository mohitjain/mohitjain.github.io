# Thin wrappers around bin/ so the common tasks are easy to remember.
.PHONY: setup serve build check post draft clean

setup:
	bin/setup

serve:
	bin/serve

build:
	bin/build

check:
	bin/check

# make post TITLE="My post title"
post:
	@test -n "$(TITLE)" || { echo 'usage: make post TITLE="My post title"'; exit 1; }
	bin/new-post "$(TITLE)"

# make draft TITLE="My draft title"
draft:
	@test -n "$(TITLE)" || { echo 'usage: make draft TITLE="My draft title"'; exit 1; }
	bin/new-post "$(TITLE)" --draft

clean:
	rm -rf _site .jekyll-cache .jekyll-metadata .lighthouseci
