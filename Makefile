run: build
	deno run -qA index.ts
build:
	npx tsc -p static
.PHONY: run
