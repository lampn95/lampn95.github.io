.PHONY: help install dev build github preview clean

help:
	@echo "Available targets:"
	@echo "  make install   - Install npm dependencies"
	@echo "  make dev       - Run dev server at http://localhost:3000"
	@echo "  make build     - Build static site into ./docs (alias of make github)"
	@echo "  make github    - Build static site for GitHub Pages into ./docs"
	@echo "  make preview   - Serve the built ./docs locally at http://localhost:8080"
	@echo "  make clean     - Remove build artifacts"

install:
	npm install

dev:
	npm run dev

build: github

github:
	@echo ">> Building static export into ./docs ..."
	rm -rf docs
	npm run build
	@touch docs/.nojekyll
	@echo ""
	@echo ">> Done."
	@echo "   - Preview locally:  make preview   (http://localhost:8080)"
	@echo "   - Or commit & push ./docs, then in GitHub repo:"
	@echo "       Settings > Pages > Source: 'Deploy from a branch'"
	@echo "       Branch: main   Folder: /docs"

preview:
	@if [ ! -d docs ]; then echo ">> ./docs not found. Run 'make github' first."; exit 1; fi
	@echo ">> Serving ./docs at http://localhost:8080 (Ctrl+C to stop) ..."
	npx --yes serve docs -l 8080

clean:
	rm -rf docs .next node_modules/.cache
