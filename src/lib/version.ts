// Lê a versão do package.json de forma dinâmica
import packageJson from "../../package.json"

export const APP_VERSION = packageJson.version
export const APP_NAME = packageJson.name
