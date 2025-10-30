// src/hooks/use-react-query.ts
"use client"
// Este arquivo atua como um barrel que reexporta hooks menores, divididos por domínio.
// Mantém o caminho de importação existente para não quebrar componentes.
export * from "./queries"
export { queryKeys } from "./queries/query-keys"


