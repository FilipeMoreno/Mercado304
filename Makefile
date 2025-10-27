.PHONY: help build up down logs restart clean shell-app shell-worker migrate seed studio

help: ## Mostra esta mensagem de ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build todas as imagens Docker
	docker-compose build

up: ## Inicia todos os serviços
	docker-compose up -d

down: ## Para e remove todos os containers
	docker-compose down

logs: ## Mostra logs de todos os serviços
	docker-compose logs -f

logs-app: ## Mostra logs do app
	docker-compose logs -f app

logs-worker: ## Mostra logs do worker
	docker-compose logs -f worker

restart: ## Reinicia todos os serviços
	docker-compose restart

clean: ## Remove containers, volumes e imagens
	docker-compose down -v
	docker-compose rm -f

shell-app: ## Abre shell no container do app
	docker-compose exec app sh

shell-worker: ## Abre shell no container do worker
	docker-compose exec worker sh

db-shell: ## Abre shell do PostgreSQL
	docker-compose exec postgres psql -U mercado304 -d mercado304

redis-cli: ## Abre CLI do Redis
	docker-compose exec redis redis-cli

migrate: ## Roda migrações do Prisma
	docker-compose exec app npx prisma migrate deploy

migrate-dev: ## Roda migrações em modo desenvolvimento
	docker-compose exec app npx prisma migrate dev

db-push: ## Push do schema para o banco
	docker-compose exec app npx prisma db push

seed: ## Popula o banco com dados de exemplo
	docker-compose exec app npm run db:seed

studio: ## Abre Prisma Studio
	docker-compose exec app npx prisma studio

generate: ## Gera Prisma Client
	docker-compose exec app npx prisma generate

rebuild: ## Rebuild completo de todas as imagens
	docker-compose build --no-cache
	docker-compose up -d

rebuild-app: ## Rebuild apenas do app
	docker-compose build --no-cache app
	docker-compose restart app

rebuild-worker: ## Rebuild apenas do worker
	docker-compose build --no-cache worker
	docker-compose restart worker

status: ## Mostra status de todos os containers
	docker-compose ps

health: ## Verifica saúde de todos os serviços
	@echo "Verificando PostgreSQL..."
	docker-compose exec postgres pg_isready -U mercado304
	@echo "Verificando Redis..."
	docker-compose exec redis redis-cli ping
	@echo "Verificando App..."
	curl -f http://localhost:3000 > /dev/null && echo "App OK" || echo "App FALHOU"
	@echo "Verificando Worker..."
	curl -f http://localhost:3100/health > /dev/null && echo "Worker OK" || echo "Worker FALHOU"

