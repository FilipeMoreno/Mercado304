-- AlterTable
ALTER TABLE "markets" ADD COLUMN "legalName" TEXT;

-- AddComment
COMMENT ON COLUMN "markets"."name" IS 'Nome fantasia/nome usado no app';
COMMENT ON COLUMN "markets"."legalName" IS 'Nome de registro/razão social (nome da nota fiscal)';

